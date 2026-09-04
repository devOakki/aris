from django.contrib import admin
from .models import ProjectSubmission


@admin.register(ProjectSubmission)
class ProjectSubmissionAdmin(admin.ModelAdmin):
    list_display = ('group', 'github_repo_url', 'live_demo_url', 'all_completed_at', 'updated_at')
    search_fields = ('group__name',)
