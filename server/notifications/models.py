import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    class EventType(models.TextChoices):
        PROPOSAL_SUBMITTED = 'PROPOSAL_SUBMITTED', 'Proposal Submitted'
        PROPOSAL_APPROVED  = 'PROPOSAL_APPROVED',  'Proposal Approved'
        PROPOSAL_REJECTED  = 'PROPOSAL_REJECTED',  'Proposal Rejected'
        SUBMISSION_DUE     = 'SUBMISSION_DUE',     'Submission Due Soon'
        SUBMISSION_DONE    = 'SUBMISSION_DONE',    'Deliverables Submitted'
        HOD_APPROVED       = 'HOD_APPROVED',       'HOD Approved'
        HOD_REJECTED       = 'HOD_REJECTED',       'HOD Rejected'
        DEAN_APPROVED      = 'DEAN_APPROVED',      'Dean Approved'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_notifications'
    )
    event_type   = models.CharField(max_length=25, choices=EventType.choices)
    title        = models.CharField(max_length=200)
    message      = models.TextField()
    target_url   = models.CharField(max_length=300, blank=True, default='')
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.event_type}] → {self.recipient.get_full_name()}"
