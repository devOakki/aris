from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from core.permissions import IsHOD, IsDean
from projects.models import StudentGroup
from .models import ApprovalRecord
from .serializers import (
    ApprovalRecordSerializer,
    ProjectDossierSerializer,
    ApprovalActionSerializer,
)


class HODDossierListView(generics.ListAPIView):
    """
    GET /api/approvals/dossiers/
    Lists all project dossiers submitted by student groups in the HOD's department.
    Supports query parameter:
      - ?status=SUBMITTED (default)
      - ?status=all (lists all groups in department)
      - ?status=HOD_APPROVED
    """
    permission_classes = [IsHOD]
    serializer_class   = ProjectDossierSerializer

    def get_queryset(self):
        hod_dept = self.request.user.department
        queryset = StudentGroup.objects.filter(track__department=hod_dept).select_related(
            'track', 'supervisor__user', 'created_by'
        ).prefetch_related(
            'members__student__user',
            'proposals',
            'approval_records__actioned_by'
        )

        status_filter = self.request.query_params.get('status', StudentGroup.Status.SUBMITTED)
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-updated_at')


class HODDossierActionView(generics.GenericAPIView):
    """
    POST /api/approvals/dossiers/<uuid:group_id>/action/
    Allows HOD to submit an approval decision (APPROVED or REJECTED) with mandatory comments.
    On approval, group status moves to HOD_APPROVED and is forwarded to the Dean.
    On rejection, group status moves to HOD_REJECTED with detailed feedback.
    """
    permission_classes = [IsHOD]
    serializer_class   = ApprovalActionSerializer

    def post(self, request, group_id, *args, **kwargs):
        try:
            group = StudentGroup.objects.select_related('track').get(id=group_id)
        except StudentGroup.DoesNotExist:
            raise NotFound("Project group dossier not found.")

        # Ensure group is in HOD's department
        if group.track.department != request.user.department:
            raise PermissionDenied("You can only review dossiers within your own department.")

        if group.status not in [StudentGroup.Status.SUBMITTED, StudentGroup.Status.HOD_REJECTED]:
            raise ValidationError(f"Group cannot be reviewed in status '{group.status}'. Must be SUBMITTED.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(group=group, reviewer=request.user, stage=ApprovalRecord.Stage.HOD)

        return Response(ProjectDossierSerializer(group).data, status=status.HTTP_200_OK)


class DeanDossierListView(generics.ListAPIView):
    """
    GET /api/approvals/dean-review/
    Lists HOD-approved project dossiers across all university departments waiting for final Dean sign-off.
    Supports query parameters:
      - ?department=Computer Applications
      - ?status=HOD_APPROVED (default)
      - ?status=all
    """
    permission_classes = [IsDean]
    serializer_class   = ProjectDossierSerializer

    def get_queryset(self):
        queryset = StudentGroup.objects.select_related(
            'track', 'supervisor__user', 'created_by'
        ).prefetch_related(
            'members__student__user',
            'proposals',
            'approval_records__actioned_by'
        )

        status_filter = self.request.query_params.get('status', StudentGroup.Status.HOD_APPROVED)
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(track__department__iexact=department)

        return queryset.order_by('-updated_at')


class DeanDossierActionView(generics.GenericAPIView):
    """
    POST /api/approvals/dean-review/<uuid:group_id>/action/
    Allows the Dean to grant final institutional approval (DEAN_APPROVED) or reject (DEAN_REJECTED).
    Final approval archives the project into the university repository.
    """
    permission_classes = [IsDean]
    serializer_class   = ApprovalActionSerializer

    def post(self, request, group_id, *args, **kwargs):
        try:
            group = StudentGroup.objects.select_related('track').get(id=group_id)
        except StudentGroup.DoesNotExist:
            raise NotFound("Project group dossier not found.")

        if group.status != StudentGroup.Status.HOD_APPROVED:
            raise ValidationError(f"Group must be HOD_APPROVED before Dean review. Current status: '{group.status}'.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(group=group, reviewer=request.user, stage=ApprovalRecord.Stage.DEAN)

        return Response(ProjectDossierSerializer(group).data, status=status.HTTP_200_OK)


class ProjectArchiveListView(generics.ListAPIView):
    """
    GET /api/approvals/archive/
    Public institutional repository of all completed, Dean-approved academic projects.
    Accessible to all logged-in students and faculty for research, reference, and plagiarism prevention.
    Supports query parameters:
      - ?department=Computer Applications
      - ?program=BCA
      - ?search=Machine Learning
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ProjectDossierSerializer

    def get_queryset(self):
        queryset = StudentGroup.objects.filter(
            status=StudentGroup.Status.DEAN_APPROVED
        ).select_related(
            'track', 'supervisor__user'
        ).prefetch_related(
            'members__student__user',
            'proposals',
            'approval_records__actioned_by'
        )

        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(track__department__iexact=department)

        program = self.request.query_params.get('program')
        if program:
            queryset = queryset.filter(track__target_program__iexact=program)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                proposals__title__icontains=search
            ) | queryset.filter(
                name__icontains=search
            )

        return queryset.distinct().order_by('-updated_at')
