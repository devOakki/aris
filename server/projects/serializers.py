from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import (
    ProjectCategory,
    ProjectTrack,
    StudentGroup,
    GroupMember,
    GroupJoinRequest,
    ProjectIdea,
    ProjectProposal,
    ProjectDeadline,
    ProjectSession,
    SessionAttendance,
)
from accounts.models import AcademicSession, StudentProfile, SupervisorProfile


class ProjectDeadlineSerializer(serializers.ModelSerializer):
    is_passed = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDeadline
        fields = (
            'id',
            'track',
            'deadline_type',
            'title',
            'due_date',
            'template_url',
            'template_filename',
            'font_family',
            'typography',
            'spacing_alignment',
            'page_margins',
            'page_limit',
            'file_format',
            'instructions',
            'late_submission_allowed',
            'is_passed',
            'created_at',
            'updated_at',
        )

    def get_is_passed(self, obj):
        return timezone.now() > obj.due_date


class ProjectTrackSerializer(serializers.ModelSerializer):
    deadlines        = ProjectDeadlineSerializer(many=True, read_only=True)
    session          = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all(), required=False)
    session_year     = serializers.CharField(source='session.year', read_only=True)
    session_term     = serializers.CharField(source='session.term', read_only=True)
    coordinator_name = serializers.CharField(source='coordinator.user.get_full_name', read_only=True)

    class Meta:
        model = ProjectTrack
        fields = (
            'id',
            'title',
            'category',
            'session',
            'session_year',
            'session_term',
            'department',
            'target_program',
            'target_semester',
            'coordinator',
            'coordinator_name',
            'is_mandatory',
            'max_group_size',
            'max_groups_per_supervisor',
            'required_deliverables',
            'min_media_files',
            'max_media_files',
            'deadlines',
            'is_active',
            'created_at',
        )


class GroupMemberSummarySerializer(serializers.ModelSerializer):
    university_id = serializers.CharField(source='student.user.university_id', read_only=True)
    full_name     = serializers.CharField(source='student.user.get_full_name', read_only=True)
    email         = serializers.EmailField(source='student.user.email', read_only=True)
    program       = serializers.CharField(source='student.program', read_only=True)
    semester      = serializers.IntegerField(source='student.semester', read_only=True)
    avatar_url    = serializers.CharField(source='student.user.avatar_url', read_only=True)

    class Meta:
        model = GroupMember
        fields = (
            'id',
            'university_id',
            'full_name',
            'email',
            'program',
            'semester',
            'member_role',
            'avatar_url',
            'joined_at',
        )


class GroupJoinRequestSerializer(serializers.ModelSerializer):
    student_id    = serializers.CharField(source='student.user.university_id', read_only=True)
    university_id = serializers.CharField(source='student.user.university_id', read_only=True)
    student_name  = serializers.CharField(source='student.user.get_full_name', read_only=True)
    full_name     = serializers.CharField(source='student.user.get_full_name', read_only=True)
    email         = serializers.EmailField(source='student.user.email', read_only=True)
    program       = serializers.CharField(source='student.program', read_only=True)
    semester      = serializers.IntegerField(source='student.semester', read_only=True)
    avatar_url    = serializers.CharField(source='student.user.avatar_url', read_only=True)

    class Meta:
        model = GroupJoinRequest
        fields = (
            'id',
            'group',
            'student',
            'student_id',
            'university_id',
            'student_name',
            'full_name',
            'email',
            'program',
            'semester',
            'avatar_url',
            'status',
            'message',
            'created_at',
            'updated_at',
        )


class StudentGroupSerializer(serializers.ModelSerializer):
    members            = GroupMemberSummarySerializer(many=True, read_only=True)
    track_id           = serializers.UUIDField(source='track.id', read_only=True)
    track_title        = serializers.CharField(source='track.title', read_only=True)
    max_group_size     = serializers.IntegerField(source='track.max_group_size', read_only=True)
    category           = serializers.CharField(source='track.category', read_only=True)
    department         = serializers.CharField(source='track.department', read_only=True)
    target_program     = serializers.CharField(source='track.target_program', read_only=True)
    target_semester    = serializers.IntegerField(source='track.target_semester', read_only=True)
    session_year       = serializers.CharField(source='track.session.year', read_only=True)
    session_term       = serializers.CharField(source='track.session.term', read_only=True)
    supervisor_name    = serializers.CharField(source='supervisor.user.get_full_name', read_only=True)
    created_by_name    = serializers.CharField(source='created_by.get_full_name', read_only=True)
    latest_proposal    = serializers.SerializerMethodField()
    supervisor_details = serializers.SerializerMethodField()
    submission         = serializers.SerializerMethodField()
    join_requests      = serializers.SerializerMethodField()
    my_join_request    = serializers.SerializerMethodField()

    class Meta:
        model = StudentGroup
        fields = (
            'id',
            'name',
            'track',
            'track_id',
            'track_title',
            'max_group_size',
            'category',
            'department',
            'target_program',
            'target_semester',
            'session_year',
            'session_term',
            'supervisor',
            'supervisor_name',
            'supervisor_details',
            'created_by',
            'created_by_name',
            'status',
            'members',
            'latest_proposal',
            'submission',
            'join_requests',
            'my_join_request',
            'created_at',
            'updated_at',
        )

    def get_my_join_request(self, obj):
        req = self.context.get('request')
        user = req.user if req else None
        if not user or not user.is_authenticated or not hasattr(user, 'student_profile'):
            return None
        join_req = obj.join_requests.filter(student=user.student_profile).order_by('-created_at').first()
        if join_req:
            return {
                'id': str(join_req.id),
                'status': join_req.status,
                'created_at': join_req.created_at,
            }
        return None

    def get_join_requests(self, obj):
        req = self.context.get('request')
        user = req.user if req else None
        if not user or not user.is_authenticated:
            return []
        # Return pending join requests if user is a member of this group
        if obj.members.filter(student__user=user).exists():
            pending = obj.join_requests.filter(status=GroupJoinRequest.Status.PENDING).select_related('student__user')
            return GroupJoinRequestSerializer(pending, many=True).data
        return []

    def get_latest_proposal(self, obj):
        latest = obj.proposals.order_by('-version').first()
        if latest:
            return ProjectProposalSerializer(latest).data
        return None

    def get_supervisor_details(self, obj):
        if not obj.supervisor:
            return None
        return {
            'id': str(obj.supervisor.id),
            'full_name': obj.supervisor.user.get_full_name(),
            'email': obj.supervisor.user.email,
            'avatar_url': obj.supervisor.user.avatar_url,
            'designation': obj.supervisor.designation,
            'department': obj.supervisor.department,
            'expertise_domains': obj.supervisor.expertise_domains,
            'expertise_tech': obj.supervisor.expertise_tech,
        }

    def get_submission(self, obj):
        submission = getattr(obj, 'submission', None)
        if not submission:
            from submissions.models import ProjectSubmission
            submission = ProjectSubmission.objects.filter(group=obj).first()
        if submission:
            return {
                'id': str(submission.id),
                'synopsis_url': submission.synopsis_url,
                'synopsis_submitted_at': submission.synopsis_submitted_at,
                'ppt_url': submission.ppt_url,
                'ppt_submitted_at': submission.ppt_submitted_at,
                'report_url': submission.report_url,
                'report_submitted_at': submission.report_submitted_at,
                'research_paper_url': submission.research_paper_url,
                'github_repo_url': submission.github_repo_url,
                'live_demo_url': submission.live_demo_url,
                'media_urls': submission.media_urls,
                'all_completed_at': submission.all_completed_at,
            }
        return None


class StudentGroupCreateSerializer(serializers.Serializer):
    name          = serializers.CharField(max_length=100)
    track_id      = serializers.UUIDField()
    supervisor_id = serializers.UUIDField(required=False, allow_null=True)
    member_ids    = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text="List of university_ids (ERP Roll numbers) of peer students to add."
    )

    def validate(self, attrs):
        user = self.context['request'].user
        try:
            student_profile = user.student_profile
        except StudentProfile.DoesNotExist:
            raise serializers.ValidationError("Only students can create project groups.")

        try:
            track = ProjectTrack.objects.get(id=attrs['track_id'], is_active=True)
        except ProjectTrack.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive Project Track.")

        # Check Creator Eligibility (Program & Semester match)
        if student_profile.program != track.target_program or student_profile.semester != track.target_semester:
            raise serializers.ValidationError(
                f"You are not eligible for this track. This track is for {track.target_program} Sem-{track.target_semester}."
            )

        # Ensure Creator is not already in another group for this track
        if GroupMember.objects.filter(student=student_profile, group__track=track).exists():
            raise serializers.ValidationError("You are already a member of a group in this project track.")

        # Validate Peers
        peer_university_ids = attrs.get('member_ids', [])
        total_members = 1 + len(peer_university_ids)
        if total_members > track.max_group_size:
            raise serializers.ValidationError(
                f"Maximum allowed members for this track is {track.max_group_size}. You provided {total_members}."
            )

        peer_profiles = []
        for roll_no in peer_university_ids:
            if roll_no == user.university_id:
                raise serializers.ValidationError("You cannot add yourself as a peer member.")
            try:
                peer_student = StudentProfile.objects.select_related('user').get(user__university_id=roll_no)
            except StudentProfile.DoesNotExist:
                raise serializers.ValidationError(f"Student with Roll No '{roll_no}' does not exist.")

            if peer_student.program != track.target_program or peer_student.semester != track.target_semester:
                raise serializers.ValidationError(
                    f"Student '{roll_no}' ({peer_student.program} Sem-{peer_student.semester}) is not eligible for this track."
                )

            if GroupMember.objects.filter(student=peer_student, group__track=track).exists():
                raise serializers.ValidationError(
                    f"Student '{roll_no}' is already a member of another group in this track."
                )

            peer_profiles.append(peer_student)

        # Validate Supervisor (if selected)
        supervisor_profile = None
        if attrs.get('supervisor_id'):
            try:
                supervisor_profile = SupervisorProfile.objects.get(id=attrs['supervisor_id'])
                if not supervisor_profile.is_accepting:
                    raise serializers.ValidationError("Selected supervisor is currently not accepting new groups.")
            except SupervisorProfile.DoesNotExist:
                raise serializers.ValidationError("Selected supervisor does not exist.")

        attrs['creator_student']   = student_profile
        attrs['peer_students']      = peer_profiles
        attrs['track_obj']          = track
        attrs['supervisor_profile'] = supervisor_profile
        return attrs

    def create(self, validated_data):
        user               = self.context['request'].user
        creator_student    = validated_data['creator_student']
        peer_students      = validated_data['peer_students']
        track              = validated_data['track_obj']
        supervisor_profile = validated_data['supervisor_profile']

        with transaction.atomic():
            group = StudentGroup.objects.create(
                name=validated_data['name'],
                track=track,
                supervisor=supervisor_profile,
                created_by=user,
                status=StudentGroup.Status.SUPERVISOR_PENDING if supervisor_profile else StudentGroup.Status.FORMED
            )

            # Add Creator as Team LEADER
            GroupMember.objects.create(
                group=group,
                student=creator_student,
                member_role=GroupMember.MemberRole.LEADER
            )

            # Add Peers as MEMBERS
            for peer in peer_students:
                GroupMember.objects.create(
                    group=group,
                    student=peer,
                    member_role=GroupMember.MemberRole.MEMBER
                )

        return group


class ProjectIdeaSerializer(serializers.ModelSerializer):
    supervisor             = serializers.PrimaryKeyRelatedField(read_only=True)
    supervisor_name        = serializers.CharField(source='supervisor.user.get_full_name', read_only=True)
    supervisor_designation = serializers.CharField(source='supervisor.designation', read_only=True)
    supervisor_avatar      = serializers.CharField(source='supervisor.user.avatar_url', read_only=True)
    taken_by_name          = serializers.CharField(source='taken_by.name', read_only=True)

    class Meta:
        model = ProjectIdea
        fields = (
            'id',
            'supervisor',
            'supervisor_name',
            'supervisor_designation',
            'supervisor_avatar',
            'title',
            'problem_statement',
            'novelty',
            'domain',
            'technologies',
            'supporting_doc_url',
            'supporting_doc_name',
            'is_taken',
            'taken_by',
            'taken_by_name',
            'created_at',
            'updated_at',
        )


class ProjectProposalSerializer(serializers.ModelSerializer):
    group_name          = serializers.CharField(source='group.name', read_only=True)
    supervisor_id       = serializers.PrimaryKeyRelatedField(source='supervisor', read_only=True)
    supervisor_name     = serializers.CharField(source='supervisor.user.get_full_name', read_only=True)
    supervisor_details  = serializers.SerializerMethodField()

    class Meta:
        model = ProjectProposal
        fields = (
            'id',
            'group',
            'group_name',
            'proposal_type',
            'project_idea',
            'supervisor',
            'supervisor_id',
            'supervisor_name',
            'supervisor_details',
            'title',
            'problem_statement',
            'novelty',
            'solution',
            'domain',
            'technologies',
            'supporting_doc_url',
            'supporting_doc_name',
            'status',
            'version',
            'supervisor_feedback',
            'decided_at',
            'created_at',
            'updated_at',
        )

    def get_supervisor_details(self, obj):
        sup = obj.supervisor or (obj.project_idea.supervisor if obj.project_idea else None)
        if not sup:
            return None
        return {
            'id': sup.id,
            'full_name': sup.user.get_full_name(),
            'email': sup.user.email,
            'avatar_url': sup.user.avatar_url,
            'designation': sup.designation,
            'department': sup.department,
            'expertise_domains': sup.expertise_domains,
            'expertise_tech': sup.expertise_tech,
            'is_accepting': sup.is_accepting,
        }


class ProjectProposalCreateSerializer(serializers.ModelSerializer):
    supervisor_id = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = ProjectProposal
        fields = (
            'group',
            'proposal_type',
            'project_idea',
            'supervisor',
            'supervisor_id',
            'title',
            'problem_statement',
            'novelty',
            'solution',
            'domain',
            'technologies',
            'supporting_doc_url',
            'supporting_doc_name',
        )
        extra_kwargs = {
            'supervisor': {'required': False},
            'novelty': {'required': False, 'allow_blank': True},
            'solution': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        user  = self.context['request'].user
        group = attrs['group']

        # Ensure request user is a member/leader of this group
        if not group.members.filter(student__user=user).exists():
            raise serializers.ValidationError("You are not a member of this group.")

        prop_type = attrs.get('proposal_type')
        if prop_type in ['CUSTOM', 'OWN_IDEA']:
            attrs['proposal_type'] = ProjectProposal.ProposalType.OWN_IDEA

        # Sync novelty and solution so neither is blank
        sol = attrs.get('solution', '').strip()
        nov = attrs.get('novelty', '').strip()
        if not nov and sol:
            attrs['novelty'] = sol
        if not sol and nov:
            attrs['solution'] = nov

        # Resolve target supervisor
        supervisor_id = attrs.pop('supervisor_id', None)
        if attrs['proposal_type'] == ProjectProposal.ProposalType.FROM_LIST:
            if not attrs.get('project_idea'):
                raise serializers.ValidationError("Project idea is required when proposal type is 'From List'.")
            attrs['supervisor'] = attrs['project_idea'].supervisor
        else:
            if supervisor_id:
                try:
                    sup = SupervisorProfile.objects.select_related('user').get(
                        id=supervisor_id,
                        approval_status='APPROVED'
                    )
                    attrs['supervisor'] = sup
                except SupervisorProfile.DoesNotExist:
                    raise serializers.ValidationError("The selected supervisor does not exist or is not approved.")
            elif not attrs.get('supervisor'):
                raise serializers.ValidationError("Please select a supervisor / mentor for your project proposal.")

        # Check supervisor mentorship quota
        target_supervisor = attrs.get('supervisor')
        if target_supervisor:
            max_quota = target_supervisor.max_groups or 10
            active_count = target_supervisor.supervised_groups.exclude(status=StudentGroup.Status.PROPOSAL_REJECTED).count()
            if active_count >= max_quota:
                raise serializers.ValidationError(
                    f"{target_supervisor.user.get_full_name()} has reached their maximum mentorship quota ({max_quota}/{max_quota} groups)."
                )

        return attrs

    def create(self, validated_data):
        group = validated_data['group']

        # Check existing proposals count to calculate version
        existing_versions = group.proposals.count()
        validated_data['version'] = existing_versions + 1

        with transaction.atomic():
            proposal = ProjectProposal.objects.create(**validated_data)
            # Supervisor is NOT assigned to group yet. It will be assigned once supervisor accepts!
            group.status = StudentGroup.Status.PROPOSAL_PENDING
            group.save(update_fields=['status'])

        return proposal


class ProjectProposalReviewSerializer(serializers.Serializer):
    """
    Serializer for supervisors to accept or reject a group's proposal.
    """
    status              = serializers.ChoiceField(choices=[
        ProjectProposal.Status.APPROVED,
        ProjectProposal.Status.REJECTED,
    ])
    supervisor_feedback = serializers.CharField(min_length=5, max_length=1000)

    def update(self, proposal: ProjectProposal, validated_data):
        from submissions.models import ProjectSubmission

        status   = validated_data['status']
        feedback = validated_data['supervisor_feedback']

        with transaction.atomic():
            proposal.status              = status
            proposal.supervisor_feedback = feedback
            proposal.decided_at          = timezone.now()
            proposal.save()

            group = proposal.group
            if status == ProjectProposal.Status.APPROVED:
                target_sup = proposal.supervisor or (proposal.project_idea.supervisor if proposal.project_idea else None)
                if target_sup:
                    max_quota = target_sup.max_groups or 10
                    active_count = target_sup.supervised_groups.exclude(status=StudentGroup.Status.PROPOSAL_REJECTED).exclude(id=group.id).count()
                    if active_count >= max_quota:
                        raise serializers.ValidationError(
                            f"Cannot approve proposal. You have reached your maximum quota ({max_quota}/{max_quota} groups)."
                        )
                    group.supervisor = target_sup

                # If tied to an idea from the supervisor's bank, mark it taken
                if proposal.project_idea:
                    idea = proposal.project_idea
                    idea.is_taken = True
                    idea.taken_by = group
                    idea.save()

                # Initialize empty submission record ready for progressive uploads
                ProjectSubmission.objects.get_or_create(group=group)
                group.status = StudentGroup.Status.ACTIVE
                group.save(update_fields=['supervisor', 'status'])
            elif status == ProjectProposal.Status.REJECTED:
                group.status = StudentGroup.Status.PROPOSAL_REJECTED
                group.save(update_fields=['status'])

        return proposal


class ProjectSessionSerializer(serializers.ModelSerializer):
    coordinator_name = serializers.CharField(source='coordinator.user.get_full_name', read_only=True)
    track_title      = serializers.CharField(source='track.title', read_only=True)

    class Meta:
        model = ProjectSession
        fields = (
            'id',
            'track',
            'track_title',
            'title',
            'session_type',
            'target_section',
            'scheduled_date',
            'start_time',
            'end_time',
            'venue',
            'description',
            'coordinator',
            'coordinator_name',
            'is_completed',
            'created_at',
        )


class SessionAttendanceSerializer(serializers.ModelSerializer):
    group_name     = serializers.CharField(source='group.name', read_only=True)
    session_title  = serializers.CharField(source='session.title', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)

    class Meta:
        model = SessionAttendance
        fields = (
            'id',
            'session',
            'session_title',
            'group',
            'group_name',
            'status',
            'progress_notes',
            'marked_by',
            'marked_by_name',
            'marked_at',
        )


