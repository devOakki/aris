import uuid
from django.db import models
from projects.models import StudentGroup


class ProjectSubmission(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group               = models.OneToOneField(StudentGroup, on_delete=models.CASCADE, related_name='submission')
    
    github_repo_url     = models.URLField(blank=True, default='')
    live_demo_url       = models.URLField(blank=True, default='')
    
    synopsis_url        = models.URLField(blank=True, default='')
    ppt_url             = models.URLField(blank=True, default='')
    report_url          = models.URLField(blank=True, default='')
    research_paper_url  = models.URLField(blank=True, default='')
    
    media_urls          = models.JSONField(default=list)
    custom_deliverables = models.JSONField(default=dict)
    
    github_submitted_at   = models.DateTimeField(null=True, blank=True)
    synopsis_submitted_at = models.DateTimeField(null=True, blank=True)
    ppt_submitted_at      = models.DateTimeField(null=True, blank=True)
    report_submitted_at   = models.DateTimeField(null=True, blank=True)
    media_submitted_at    = models.DateTimeField(null=True, blank=True)
    all_completed_at      = models.DateTimeField(null=True, blank=True)
    
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_submissions'

    def __str__(self):
        return f"Submission — {self.group.name}"

