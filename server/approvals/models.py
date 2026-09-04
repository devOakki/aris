import uuid
from django.db import models
from django.conf import settings
from projects.models import StudentGroup


class ApprovalRecord(models.Model):
    class Stage(models.TextChoices):
        HOD  = 'HOD',  'HOD Review'
        DEAN = 'DEAN', 'Dean Review'

    class Action(models.TextChoices):
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group       = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='approval_records')
    stage       = models.CharField(max_length=10, choices=Stage.choices)
    action      = models.CharField(max_length=10, choices=Action.choices)
    comment     = models.TextField()
    actioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='approval_actions'
    )
    actioned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'approval_records'
        ordering = ['-actioned_at']

    def __str__(self):
        return f"{self.stage} — {self.action} — {self.group.name}"
