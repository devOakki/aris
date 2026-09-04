from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied
from core.permissions import IsStudent, IsSupervisor, IsHOD, IsHODOrDean
from .models import (
    ProjectTrack,
    StudentGroup,
    GroupMember,
    ProjectIdea,
    ProjectProposal,
)
from .serializers import (
    ProjectTrackSerializer,
    StudentGroupSerializer,
    StudentGroupCreateSerializer,
    ProjectIdeaSerializer,
    ProjectProposalSerializer,
    ProjectProposalCreateSerializer,
    ProjectProposalReviewSerializer,
)


class ProjectTrackListCreateView(generics.ListCreateAPIView):
    """
    GET /api/projects/tracks/
    Lists available project tracks.
    Supports query parameters:
      - ?eligible_only=true : filters tracks matching the logged-in student's program and semester.
      - ?department=Computer Applications
      - ?category=CAPSTONE

    POST /api/projects/tracks/
    HOD-only endpoint to create a new project track for their department.
    """
    serializer_class = ProjectTrackSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHOD()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = ProjectTrack.objects.filter(is_active=True).prefetch_related('deadlines').select_related('session')
        user = self.request.user

        # Filter for student's specific program & semester if requested
        eligible_only = self.request.query_params.get('eligible_only', '').lower() == 'true'
        if eligible_only and hasattr(user, 'student_profile'):
            student = user.student_profile
            queryset = queryset.filter(
                target_program=student.program,
                target_semester=student.semester
            )

        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department__iexact=department)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Auto-lock department to the HOD's department
        serializer.save(department=self.request.user.department)


class ProjectTrackDetailView(generics.RetrieveAPIView):
    """
    GET /api/projects/tracks/<uuid:pk>/
    Returns track details with all nested deadlines and deliverable requirements.
    """
    queryset         = ProjectTrack.objects.prefetch_related('deadlines').select_related('session')
    serializer_class = ProjectTrackSerializer
    permission_classes = [IsAuthenticated]


class StudentGroupCreateView(generics.GenericAPIView):
    """
    POST /api/projects/groups/
    Allows an eligible student to create a new project group, specify team members by Roll No,
    and select a supervisor.
    """
    permission_classes = [IsStudent]
    serializer_class   = StudentGroupCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        group = serializer.save()
        return Response(StudentGroupSerializer(group).data, status=status.HTTP_201_CREATED)


class MyStudentGroupView(generics.RetrieveAPIView):
    """
    GET /api/projects/groups/my-group/
    Returns the project group of the logged-in student, including member roster,
    supervisor info, and latest proposal status.
    """
    permission_classes = [IsStudent]
    serializer_class   = StudentGroupSerializer

    def get_object(self):
        user = self.request.user
        member_record = GroupMember.objects.filter(student__user=user).select_related('group').first()
        if not member_record:
            raise NotFound("You have not formed or joined any project group yet.")
        return member_record.group


class SupervisorGroupsListView(generics.ListAPIView):
    """
    GET /api/projects/groups/supervisor-groups/
    Returns all project groups currently assigned to the logged-in supervisor.
    Supports query parameter ?status=
    """
    permission_classes = [IsSupervisor]
    serializer_class   = StudentGroupSerializer

    def get_queryset(self):
        supervisor = self.request.user.supervisor_profile
        queryset = StudentGroup.objects.filter(supervisor=supervisor).select_related(
            'track', 'supervisor__user', 'created_by'
        ).prefetch_related('members__student__user', 'proposals')

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by('-created_at')


class ProjectIdeaListCreateView(generics.ListCreateAPIView):
    """
    GET /api/projects/ideas/
    Lists faculty project ideas.
    Query parameters:
      - ?available_only=true
      - ?domain=AI / ML
      - ?supervisor_id=<uuid>

    POST /api/projects/ideas/
    Allows supervisors to add new project ideas to their department idea bank.
    """
    serializer_class = ProjectIdeaSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSupervisor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = ProjectIdea.objects.select_related('supervisor__user', 'taken_by')

        if self.request.query_params.get('available_only', '').lower() == 'true':
            queryset = queryset.filter(is_taken=False)

        domain = self.request.query_params.get('domain')
        if domain:
            queryset = queryset.filter(domain__icontains=domain)

        supervisor_id = self.request.query_params.get('supervisor_id')
        if supervisor_id:
            queryset = queryset.filter(supervisor_id=supervisor_id)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(supervisor=self.request.user.supervisor_profile)


class ProjectProposalCreateView(generics.CreateAPIView):
    """
    POST /api/projects/proposals/
    Allows a student group member to submit a project proposal (from idea bank or own idea).
    Automatically calculates version and updates group status.
    """
    permission_classes = [IsStudent]
    serializer_class   = ProjectProposalCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        proposal = serializer.save()
        return Response(ProjectProposalSerializer(proposal).data, status=status.HTTP_201_CREATED)


class ProjectProposalReviewView(generics.GenericAPIView):
    """
    POST /api/projects/proposals/<uuid:pk>/review/
    Allows the assigned supervisor to accept or reject a group's proposal with feedback comments.
    """
    permission_classes = [IsSupervisor]
    serializer_class   = ProjectProposalReviewSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            proposal = ProjectProposal.objects.select_related('group__supervisor').get(id=pk)
        except ProjectProposal.DoesNotExist:
            raise NotFound("Project proposal not found.")

        # Ensure request supervisor is indeed the supervisor of this group
        if proposal.group.supervisor != request.user.supervisor_profile:
            raise PermissionDenied("You are not the assigned supervisor for this group.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_proposal = serializer.update(proposal, serializer.validated_data)

        return Response(ProjectProposalSerializer(updated_proposal).data, status=status.HTTP_200_OK)
