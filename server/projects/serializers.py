from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import (
    ProjectCategory,
    ProjectTrack,
    StudentGroup,
    GroupMember,
    ProjectIdea,
    ProjectProposal,
    ProjectDeadline,
)
from accounts.models import StudentProfile, SupervisorProfile


class ProjectDeadlineSerializer(serializers.ModelSerializer):
    is_passed = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDeadline
        fields = (
            'id',
            'deadline_type',
            'title',
            'due_date',
            'is_passed',
            'created_at',
        )

    def get_is_passed(self, obj):
        return timezone.now() > obj.due_date


class ProjectTrackSerializer(serializers.ModelSerializer):
    deadlines    = ProjectDeadlineSerializer(many=True, read_only=True)
    session_year = serializers.CharField(source='session.year', read_only=True)
    session_term = serializers.CharField(source='session.term', read_only=True)

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
            'is_mandatory',
            'max_group_size',
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
            'joined_at',
        )


class StudentGroupSerializer(serializers.ModelSerializer):
    members         = GroupMemberSummarySerializer(many=True, read_only=True)
    track_title     = serializers.CharField(source='track.title', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.user.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    latest_proposal = serializers.SerializerMethodField()

    class Meta:
        model = StudentGroup
        fields = (
            'id',
            'name',
            'track',
            'track_title',
            'supervisor',
            'supervisor_name',
            'created_by',
            'created_by_name',
            'status',
            'members',
            'latest_proposal',
            'created_at',
            'updated_at',
        )

    def get_latest_proposal(self, obj):
        latest = obj.proposals.order_by('-version').first()
        if latest:
            return ProjectProposalSerializer(latest).data
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
    supervisor_name = serializers.CharField(source='supervisor.user.get_full_name', read_only=True)
    taken_by_name   = serializers.CharField(source='taken_by.name', read_only=True)

    class Meta:
        model = ProjectIdea
        fields = (
            'id',
            'supervisor',
            'supervisor_name',
            'title',
            'problem_statement',
            'novelty',
            'domain',
            'technologies',
            'is_taken',
            'taken_by',
            'taken_by_name',
            'created_at',
        )


class ProjectProposalSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = ProjectProposal
        fields = (
            'id',
            'group',
            'group_name',
            'proposal_type',
            'project_idea',
            'title',
            'problem_statement',
            'novelty',
            'domain',
            'technologies',
            'status',
            'version',
            'supervisor_feedback',
            'decided_at',
            'created_at',
            'updated_at',
        )


class ProjectProposalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectProposal
        fields = (
            'group',
            'proposal_type',
            'project_idea',
            'title',
            'problem_statement',
            'novelty',
            'domain',
            'technologies',
        )

    def validate(self, attrs):
        user  = self.context['request'].user
        group = attrs['group']

        # Ensure request user is a member/leader of this group
        if not group.members.filter(student__user=user).exists():
            raise serializers.ValidationError("You are not a member of this group.")

        # If proposal is FROM_LIST, ensure project_idea belongs to the group's assigned supervisor
        if attrs['proposal_type'] == ProjectProposal.ProposalType.FROM_LIST:
            if not attrs.get('project_idea'):
                raise serializers.ValidationError("Project idea is required when proposal type is 'From List'.")
            if attrs['project_idea'].supervisor != group.supervisor:
                raise serializers.ValidationError("The selected idea does not belong to your assigned supervisor.")

        return attrs

    def create(self, validated_data):
        group = validated_data['group']

        # Check existing proposals count to calculate version
        existing_versions = group.proposals.count()
        validated_data['version'] = existing_versions + 1

        with transaction.atomic():
            proposal = ProjectProposal.objects.create(**validated_data)
            # Update group status to PROPOSAL_PENDING
            group.status = StudentGroup.Status.PROPOSAL_PENDING
            group.save()

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
                group.status = StudentGroup.Status.IN_PROGRESS
                # If tied to an idea from the supervisor's bank, mark it taken
                if proposal.project_idea:
                    idea = proposal.project_idea
                    idea.is_taken = True
                    idea.taken_by = group
                    idea.save()
                # Initialize empty submission record ready for progressive uploads
                ProjectSubmission.objects.get_or_create(group=group)
            elif status == ProjectProposal.Status.REJECTED:
                group.status = StudentGroup.Status.PROPOSAL_REJECTED

            group.save()

        return proposal

