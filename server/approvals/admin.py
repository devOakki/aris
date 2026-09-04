from django.contrib import admin
from .models import ApprovalRecord


@admin.register(ApprovalRecord)
class ApprovalRecordAdmin(admin.ModelAdmin):
    list_display = ('group', 'stage', 'action', 'actioned_by', 'actioned_at')
    list_filter = ('stage', 'action')
    search_fields = ('group__name', 'actioned_by__first_name', 'actioned_by__university_id')
