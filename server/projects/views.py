from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from django.utils import timezone
from core.permissions import IsStudent, IsSupervisor, IsHOD, IsHODOrDean
from .models import (
    ProjectTrack,
    StudentGroup,
    GroupMember,
    ProjectIdea,
    ProjectProposal,
    ProjectDeadline,
    ProjectSession,
    SessionAttendance,
)
from .serializers import (
    ProjectTrackSerializer,
    StudentGroupSerializer,
    StudentGroupCreateSerializer,
    ProjectIdeaSerializer,
    ProjectProposalSerializer,
    ProjectProposalCreateSerializer,
    ProjectProposalReviewSerializer,
    ProjectDeadlineSerializer,
    ProjectSessionSerializer,
    SessionAttendanceSerializer,
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

        session_year = self.request.query_params.get('session_year')
        if session_year:
            queryset = queryset.filter(session__year=session_year)

        session_term = self.request.query_params.get('session_term')
        if session_term:
            queryset = queryset.filter(session__term=session_term.upper())

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        from accounts.models import AcademicSession
        session = serializer.validated_data.get('session')
        if not session:
            session = AcademicSession.objects.filter(is_active=True).first()
        serializer.save(
            department=self.request.user.department,
            session=session,
            created_by=self.request.user
        )


class ProjectTrackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/projects/tracks/<uuid:pk>/
    Returns track details with all nested deadlines and deliverable requirements.

    PUT/PATCH/DELETE /api/projects/tracks/<uuid:pk>/
    Allows HOD to update or delete a track within their department.
    """
    queryset         = ProjectTrack.objects.prefetch_related('deadlines').select_related('session')
    serializer_class = ProjectTrackSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsHOD()]
        return [IsAuthenticated()]


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


class MyStudentGroupSelectSupervisorView(generics.GenericAPIView):
    """
    POST /api/projects/groups/my-group/select-supervisor/
    Body: {"supervisor_id": 123}
    Allows a student group to select or request an approved faculty supervisor.
    """
    permission_classes = [IsStudent]

    def post(self, request, *args, **kwargs):
        user = request.user
        member = GroupMember.objects.filter(student__user=user).select_related('group').first()
        if not member:
            return Response({'detail': 'You have not joined any group.'}, status=status.HTTP_400_BAD_REQUEST)

        group = member.group
        supervisor_id = request.data.get('supervisor_id')
        if not supervisor_id:
            return Response({'detail': 'supervisor_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from accounts.models import SupervisorProfile
        try:
            supervisor = SupervisorProfile.objects.select_related('user').get(
                id=supervisor_id,
                approval_status='APPROVED',
                is_accepting=True
            )
        except SupervisorProfile.DoesNotExist:
            return Response(
                {'detail': 'Selected supervisor is either not found, not approved, or not accepting groups.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        group.supervisor = supervisor
        if group.status in [StudentGroup.Status.FORMED, StudentGroup.Status.SUPERVISOR_PENDING]:
            group.status = StudentGroup.Status.SUPERVISOR_PENDING
        group.save(update_fields=['supervisor', 'status', 'updated_at'])

        return Response(StudentGroupSerializer(group).data, status=status.HTTP_200_OK)


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


class ProjectSessionListCreateView(generics.ListCreateAPIView):
    """
    GET /api/projects/sessions/
    Lists scheduled lab sessions & physical presentations.
    Supports query parameters:
      - ?track_id=<uuid>
      - ?section=A

    POST /api/projects/sessions/
    Allows Track Coordinator (or HOD) to schedule a physical session/presentation date, time, and venue.
    """
    serializer_class = ProjectSessionSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSupervisor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = ProjectSession.objects.select_related('track', 'coordinator__user')

        track_id = self.request.query_params.get('track_id')
        if track_id:
            queryset = queryset.filter(track_id=track_id)

        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(target_section__in=[section, 'ALL'])

        return queryset.order_by('scheduled_date', 'start_time')

    def perform_create(self, serializer):
        user = self.request.user
        coordinator_profile = getattr(user, 'supervisor_profile', None)
        serializer.save(coordinator=coordinator_profile)


class SessionAttendanceListCreateView(generics.ListCreateAPIView):
    """
    GET /api/projects/sessions/<uuid:session_id>/attendance/
    Returns attendance records for that session.

    POST /api/projects/sessions/<uuid:session_id>/attendance/
    Allows Coordinator to mark group-wise physical attendance (PRESENT/ABSENT/LATE) and enter progress notes.
    """
    serializer_class = SessionAttendanceSerializer
    permission_classes = [IsSupervisor]

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        return SessionAttendance.objects.filter(session_id=session_id).select_related('group', 'marked_by')

    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        session = ProjectSession.objects.get(id=session_id)
        serializer.save(session=session, marked_by=self.request.user)


class TrackDeadlineManageView(generics.GenericAPIView):
    """
    GET /api/projects/tracks/<uuid:track_id>/deadlines/
    Lists all configured deadlines for this track.

    POST /api/projects/tracks/<uuid:track_id>/deadlines/
    Allows HOD to set or update a milestone deadline, attach format templates (PPT/Report),
    provide custom guidelines, and dispatch institutional notification emails to all enrolled students.
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHODOrDean()]
        return [IsAuthenticated()]

    def get(self, request, track_id, *args, **kwargs):
        try:
            track = ProjectTrack.objects.get(id=track_id)
        except ProjectTrack.DoesNotExist:
            raise NotFound("Project track not found.")
        deadlines = ProjectDeadline.objects.filter(track=track).order_by('due_date')
        return Response(ProjectDeadlineSerializer(deadlines, many=True).data)

    def post(self, request, track_id, *args, **kwargs):
        try:
            track = ProjectTrack.objects.get(id=track_id)
        except ProjectTrack.DoesNotExist:
            raise NotFound("Project track not found.")

        deadline_type = request.data.get('deadline_type', '').upper()
        if deadline_type not in dict(ProjectDeadline.DeadlineType.choices):
            raise ValidationError({'deadline_type': f"Invalid deadline type. Choices: {list(dict(ProjectDeadline.DeadlineType.choices).keys())}"})

        due_date_str = request.data.get('due_date')
        if not due_date_str:
            raise ValidationError({'due_date': 'Due date and time is required.'})

        try:
            from django.utils.dateparse import parse_datetime
            due_date = parse_datetime(due_date_str)
            if not due_date:
                raise ValueError()
        except Exception:
            raise ValidationError({'due_date': 'Invalid ISO datetime format (e.g. 2026-09-25T23:59:00Z).'})

        title = request.data.get('title', '') or dict(ProjectDeadline.DeadlineType.choices).get(deadline_type, 'Milestone Deadline')
        template_url = request.data.get('template_url', '')
        template_filename = request.data.get('template_filename', '')
        instructions = request.data.get('instructions', '')
        late_submission_allowed = bool(request.data.get('late_submission_allowed', False))
        notify_students = bool(request.data.get('notify_students', True))

        deadline, created = ProjectDeadline.objects.update_or_create(
            track=track,
            deadline_type=deadline_type,
            defaults={
                'title': title,
                'due_date': due_date,
                'template_url': template_url,
                'template_filename': template_filename,
                'instructions': instructions,
                'late_submission_allowed': late_submission_allowed,
                'set_by': request.user,
            }
        )

        # Notify all enrolled students if requested
        notified_emails = []
        if notify_students:
            from core.email_service import send_deadline_announcement_email
            from notifications.models import Notification
            
            enrolled_members = GroupMember.objects.filter(
                group__track=track
            ).select_related('student__user')

            local_due = timezone.localtime(due_date) if timezone.is_aware(due_date) else due_date
            friendly_date = local_due.strftime("%d %b %Y, %I:%M %p")

            seen_user_ids = set()
            for m in enrolled_members:
                u = m.student.user
                if u.id in seen_user_ids:
                    continue
                seen_user_ids.add(u.id)

                if u.email:
                    send_deadline_announcement_email(
                        student_email=u.email,
                        student_name=u.get_full_name(),
                        track_title=track.title,
                        deadline_type_display=deadline.get_deadline_type_display(),
                        due_date_str=friendly_date,
                        instructions=instructions,
                        template_url=template_url,
                        template_filename=template_filename,
                        department=track.department
                    )
                    notified_emails.append(u.email)

                # In-app notification
                Notification.objects.create(
                    recipient=u,
                    triggered_by=request.user,
                    event_type=Notification.EventType.SUBMISSION_DUE,
                    title=f"New Deadline: {deadline.get_deadline_type_display()}",
                    message=f"{track.title} deadline set for {friendly_date}. Review guidelines and submit on ARIS.",
                    target_url='/dashboard/student'
                )

        res_data = ProjectDeadlineSerializer(deadline).data
        res_data['dispatched_notifications_count'] = len(notified_emails)
        return Response(res_data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class TrackGroupsListView(generics.ListAPIView):
    """
    GET /api/projects/tracks/<uuid:track_id>/groups/
    Lists all existing groups for a track. Students can browse and send a join request.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StudentGroupSerializer

    def get_queryset(self):
        track_id = self.kwargs['track_id']
        return (
            StudentGroup.objects
            .filter(track_id=track_id)
            .select_related('track', 'supervisor__user', 'created_by')
            .prefetch_related('members__student__user')
            .order_by('created_at')
        )


class GroupJoinRequestView(generics.GenericAPIView):
    """
    POST /api/projects/groups/<uuid:group_id>/request-join/
    Student directly joins an existing group as a MEMBER (leader accept/deny UI comes later).
    """
    permission_classes = [IsStudent]

    def post(self, request, group_id, *args, **kwargs):
        try:
            group = StudentGroup.objects.select_related('track').get(id=group_id)
        except StudentGroup.DoesNotExist:
            raise NotFound('Group not found.')

        student_profile = request.user.student_profile

        if GroupMember.objects.filter(group=group, student=student_profile).exists():
            return Response({'detail': 'You are already a member of this group.'}, status=status.HTTP_400_BAD_REQUEST)

        if GroupMember.objects.filter(student=student_profile, group__track=group.track).exists():
            return Response({'detail': 'You are already in another group for this track.'}, status=status.HTTP_400_BAD_REQUEST)

        if student_profile.program != group.track.target_program or student_profile.semester != group.track.target_semester:
            return Response({'detail': 'You are not eligible for this track.'}, status=status.HTTP_400_BAD_REQUEST)

        if group.members.count() >= group.track.max_group_size:
            return Response({'detail': 'This group is already full.'}, status=status.HTTP_400_BAD_REQUEST)

        GroupMember.objects.create(
            group=group,
            student=student_profile,
            member_role=GroupMember.MemberRole.MEMBER
        )

        return Response(StudentGroupSerializer(group).data, status=status.HTTP_200_OK)
