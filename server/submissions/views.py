from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied
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
