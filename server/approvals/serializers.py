from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import ApprovalRecord
from projects.models import StudentGroup, ProjectProposal
from submissions.models import ProjectSubmission
from projects.serializers import GroupMemberSummarySerializer, ProjectProposalSerializer
from submissions.serializers import ProjectSubmissionSerializer
from notifications.models import Notification


class ApprovalRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing immutable audit trail logs of HOD/Dean reviews.
    """
    actioned_by_name = serializers.CharField(source='actioned_by.get_full_name', read_only=True)
    actioned_by_role = serializers.CharField(source='actioned_by.role', read_only=True)
    group_name       = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = ApprovalRecord
        fields = (
            'id',
            'group',
            'group_name',
            'stage',
            'action',
            'comment',
            'actioned_by',
            'actioned_by_name',
            'actioned_by_role',
            'actioned_at',
        )
        read_only_fields = fields


class ProjectDossierSerializer(serializers.ModelSerializer):
    """
    Comprehensive dossier representation of a StudentGroup used by HOD and Dean
    to evaluate all deliverables, proposal details, group members, and past review history in one payload.
    """
    members          = GroupMemberSummarySerializer(many=True, read_only=True)
    track_title      = serializers.CharField(source='track.title', read_only=True)
    department       = serializers.CharField(source='track.department', read_only=True)
    target_program   = serializers.CharField(source='track.target_program', read_only=True)
    target_semester  = serializers.IntegerField(source='track.target_semester', read_only=True)
    supervisor_name  = serializers.CharField(source='supervisor.user.get_full_name', read_only=True)
    submission       = ProjectSubmissionSerializer(read_only=True)
    approved_proposal = serializers.SerializerMethodField()
    approval_records = ApprovalRecordSerializer(many=True, read_only=True)

    class Meta:
        model = StudentGroup
        fields = (
            'id',
            'name',
            'status',
            'track',
            'track_title',
            'department',
            'target_program',
            'target_semester',
            'supervisor',
            'supervisor_name',
            'members',
            'approved_proposal',
            'submission',
            'approval_records',
            'created_at',
            'updated_at',
        )

    def get_approved_proposal(self, obj):
        # Return the latest approved proposal, or the latest submitted proposal
        proposal = obj.proposals.filter(status=ProjectProposal.Status.APPROVED).first()
        if not proposal:
            proposal = obj.proposals.order_by('-version').first()
        if proposal:
            return ProjectProposalSerializer(proposal).data
        return None


class ApprovalActionSerializer(serializers.Serializer):
    """
    Input serializer for HOD and Dean to submit Approved or Rejected verdicts with mandatory comments.
    """
    action  = serializers.ChoiceField(choices=ApprovalRecord.Action.choices)
    comment = serializers.CharField(min_length=5, max_length=1000, help_text="Mandatory academic review feedback.")

    def save(self, group: StudentGroup, reviewer, stage: str):
        action  = self.validated_data['action']
        comment = self.validated_data['comment']

        with transaction.atomic():
            # 1. Append immutable audit record
            record = ApprovalRecord.objects.create(
                group=group,
                stage=stage,
                action=action,
                comment=comment,
                actioned_by=reviewer
            )

            # 2. Transition Group Status
            if stage == ApprovalRecord.Stage.HOD:
                if action == ApprovalRecord.Action.APPROVED:
                    group.status = StudentGroup.Status.HOD_APPROVED
                    event_type = Notification.EventType.HOD_APPROVED
                    notif_title = f"HOD Approved: {group.name}"
                    notif_msg = f"HOD {reviewer.get_full_name()} has approved your project dossier. Proceeding to Dean review."
                else:
                    group.status = StudentGroup.Status.HOD_REJECTED
                    event_type = Notification.EventType.HOD_REJECTED
                    notif_title = f"HOD Action Required: {group.name}"
                    notif_msg = f"HOD has requested revisions: '{comment}'"

            elif stage == ApprovalRecord.Stage.DEAN:
                if action == ApprovalRecord.Action.APPROVED:
                    group.status = StudentGroup.Status.DEAN_APPROVED
                    event_type = Notification.EventType.DEAN_APPROVED
                    notif_title = f"Dean Approved (Final): {group.name}"
                    notif_msg = f"Dean {reviewer.get_full_name()} has granted final approval! Your project is now officially archived."
                else:
                    group.status = StudentGroup.Status.DEAN_REJECTED
                    event_type = Notification.EventType.DEAN_APPROVED  # or custom reject
                    notif_title = f"Dean Rejection: {group.name}"
                    notif_msg = f"Dean has rejected project dossier: '{comment}'"

            group.save()

            # 3. Create In-App Notifications for all Group Members
            for member in group.members.select_related('student__user').all():
                Notification.objects.create(
                    recipient=member.student.user,
                    triggered_by=reviewer,
                    event_type=event_type,
                    title=notif_title,
                    message=notif_msg,
                    target_url=f"/projects/my-group/"
                )

            # Also notify supervisor
            if group.supervisor and group.supervisor.user:
                Notification.objects.create(
                    recipient=group.supervisor.user,
                    triggered_by=reviewer,
                    event_type=event_type,
                    title=notif_title,
                    message=f"Group '{group.name}' under your guidance received {stage} {action}.",
                    target_url=f"/supervisor/groups/"
                )

            return record
