import os
import cloudinary.uploader
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from core.permissions import IsStudent
from projects.models import StudentGroup, GroupMember
from .models import ProjectSubmission
from .serializers import (
    ProjectSubmissionSerializer,
    ProjectSubmissionUpdateSerializer,
)


class MySubmissionView(generics.GenericAPIView):
    """
    GET /api/submissions/my-submission/
    Retrieves the project submission deliverables and milestone timestamps for the logged-in student's group.
    Supervisors can also view by supplying ?group_id=<uuid>.

    PATCH /api/submissions/my-submission/
    Allows students to progressively upload or update deliverables (GitHub link, live demo,
    synopsis URL, PPT URL, report URL, research paper URL, and 5-10 media screenshots).
    Automatically timestamps each item and marks group as SUBMITTED once all deliverables are complete.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user

        # If supervisor requesting with ?group_id=
        if hasattr(user, 'supervisor_profile') and 'group_id' in self.request.query_params:
            group_id = self.request.query_params.get('group_id')
            try:
                submission = ProjectSubmission.objects.select_related('group__track').get(group_id=group_id)
            except ProjectSubmission.DoesNotExist:
                raise NotFound("No submission found for this group.")
            return submission

        # If student
        member_record = GroupMember.objects.filter(student__user=user).select_related('group').first()
        if not member_record:
            raise NotFound("You are not part of any project group.")

        group = member_record.group
        # Auto-create submission record if not already created
        submission, _ = ProjectSubmission.objects.get_or_create(group=group)
        return submission

    def get(self, request, *args, **kwargs):
        submission = self.get_object()
        serializer = ProjectSubmissionSerializer(submission)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        user = self.request.user
        member_record = GroupMember.objects.filter(student__user=user).select_related('group').first()
        if not member_record:
            raise PermissionDenied("Only members of the project group can submit deliverables.")

        submission = self.get_object()
        serializer = ProjectSubmissionUpdateSerializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_submission = serializer.save()

        return Response(ProjectSubmissionSerializer(updated_submission).data, status=status.HTTP_200_OK)


class GroupSubmissionDetailView(generics.RetrieveAPIView):
    """
    GET /api/submissions/group/<uuid:group_id>/
    Allows faculty, HOD, and Dean to inspect deliverables for a specific group.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ProjectSubmissionSerializer

    def get_object(self):
        group_id = self.kwargs['group_id']
        try:
            return ProjectSubmission.objects.select_related('group__track').get(group_id=group_id)
        except ProjectSubmission.DoesNotExist:
            raise NotFound("No submission record found for this group.")


class FileUploadView(generics.GenericAPIView):
    """
    POST /api/submissions/upload/
    Uploads a deliverable document (PDF/PPT) or screenshot directly to Cloudinary.
    Expects multipart/form-data:
      - file: binary file
      - deliverable_type: 'SYNOPSIS' | 'PPT' | 'REPORT' | 'RESEARCH_PAPER' | 'MEDIA' | 'AVATAR'
      - auto_attach: 'true' | 'false' (default 'true')
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    ALLOWED_EXTENSIONS = {
        'SYNOPSIS': ['.pdf'],
        'REPORT': ['.pdf'],
        'RESEARCH_PAPER': ['.pdf'],
        'PPT': ['.pdf', '.ppt', '.pptx'],
        'MEDIA': ['.jpg', '.jpeg', '.png', '.webp'],
        'AVATAR': ['.jpg', '.jpeg', '.png', '.webp'],
    }

    MAX_FILE_SIZES = {
        'SYNOPSIS': 20 * 1024 * 1024,        # 20MB
        'REPORT': 30 * 1024 * 1024,          # 30MB
        'RESEARCH_PAPER': 20 * 1024 * 1024,  # 20MB
        'PPT': 25 * 1024 * 1024,             # 25MB
        'MEDIA': 10 * 1024 * 1024,           # 10MB
        'AVATAR': 5 * 1024 * 1024,           # 5MB
    }

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            raise ValidationError({'file': 'No file was uploaded.'})

        deliverable_type = request.data.get('deliverable_type', '').upper()
        if deliverable_type not in self.ALLOWED_EXTENSIONS:
            raise ValidationError({
                'deliverable_type': f"Invalid deliverable type '{deliverable_type}'. Must be one of: {list(self.ALLOWED_EXTENSIONS.keys())}"
            })

        # Validate file extension
        _, ext = os.path.splitext(file_obj.name)
        ext = ext.lower()
        allowed = self.ALLOWED_EXTENSIONS[deliverable_type]
        if ext not in allowed:
            raise ValidationError({
                'file': f"File extension '{ext}' is not allowed for {deliverable_type}. Allowed extensions: {allowed}"
            })

        # Validate file size
        max_size = self.MAX_FILE_SIZES[deliverable_type]
        if file_obj.size > max_size:
            max_mb = max_size // (1024 * 1024)
            raise ValidationError({
                'file': f"File size ({file_obj.size / (1024*1024):.1f}MB) exceeds the maximum limit of {max_mb}MB."
            })

        # Upload to Cloudinary
        folder = f"aris/{deliverable_type.lower()}"
        resource_type = 'image' if deliverable_type in ['MEDIA', 'AVATAR'] else 'raw'

        try:
            upload_result = cloudinary.uploader.upload(
                file_obj,
                folder=folder,
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True
            )
        except Exception as e:
            return Response(
                {'detail': f"Cloudinary upload failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY
            )

        secure_url = upload_result.get('secure_url')
        response_data = {
            'secure_url': secure_url,
            'deliverable_type': deliverable_type,
            'public_id': upload_result.get('public_id'),
            'format': upload_result.get('format', ext.lstrip('.')),
            'bytes': upload_result.get('bytes', file_obj.size),
        }

        # Auto-attach URL directly to student's submission record or user avatar
        auto_attach = request.data.get('auto_attach', 'true').lower() == 'true'
        if auto_attach:
            now = timezone.now()
            user = request.user

            if deliverable_type == 'AVATAR':
                user.avatar_url = secure_url
                user.save(update_fields=['avatar_url'])
                response_data['attached_to'] = 'avatar'

            else:
                member_record = GroupMember.objects.filter(student__user=user).select_related('group__track').first()
                if member_record:
                    group = member_record.group
                    submission, _ = ProjectSubmission.objects.get_or_create(group=group)

                    if deliverable_type == 'SYNOPSIS':
                        submission.synopsis_url = secure_url
                        submission.synopsis_submitted_at = now
                    elif deliverable_type == 'PPT':
                        submission.ppt_url = secure_url
                        submission.ppt_submitted_at = now
                    elif deliverable_type == 'REPORT':
                        submission.report_url = secure_url
                        submission.report_submitted_at = now
                    elif deliverable_type == 'RESEARCH_PAPER':
                        submission.research_paper_url = secure_url
                    elif deliverable_type == 'MEDIA':
                        if not submission.media_urls:
                            submission.media_urls = []
                        submission.media_urls.append(secure_url)
                        submission.media_submitted_at = now

                    # Check if all required deliverables are completed
                    required = group.track.required_deliverables
                    checks = []
                    if "SYNOPSIS" in required: checks.append(bool(submission.synopsis_url))
                    if "PPT" in required: checks.append(bool(submission.ppt_url))
                    if "REPORT" in required: checks.append(bool(submission.report_url))
                    if "GITHUB" in required: checks.append(bool(submission.github_repo_url))
                    if "MEDIA" in required: checks.append(bool(len(submission.media_urls) >= group.track.min_media_files))

                    if checks and all(checks):
                        submission.all_completed_at = now
                        group.status = StudentGroup.Status.SUBMITTED
                        group.save()

                    submission.save()
                    response_data['submission'] = ProjectSubmissionSerializer(submission).data

        return Response(response_data, status=status.HTTP_201_CREATED)
