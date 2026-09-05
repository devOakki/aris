from django.contrib import admin
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


@admin.register(ProjectTrack)
class ProjectTrackAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'session', 'department', 'coordinator', 'target_program', 'target_semester', 'is_mandatory', 'is_active')
    list_filter = ('category', 'department', 'target_program', 'target_semester', 'is_mandatory', 'is_active')
    search_fields = ('title', 'department')


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'track', 'supervisor', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'track__category', 'track__session')
    search_fields = ('name', 'created_by__university_id', 'created_by__first_name')


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ('group', 'student', 'member_role', 'joined_at')
    list_filter = ('member_role',)
    search_fields = ('group__name', 'student__user__university_id', 'student__user__first_name')


@admin.register(ProjectIdea)
class ProjectIdeaAdmin(admin.ModelAdmin):
    list_display = ('title', 'supervisor', 'domain', 'is_taken', 'taken_by', 'created_at')
    list_filter = ('domain', 'is_taken')
    search_fields = ('title', 'supervisor__user__first_name', 'supervisor__user__last_name')


@admin.register(ProjectProposal)
class ProjectProposalAdmin(admin.ModelAdmin):
    list_display = ('group', 'title', 'proposal_type', 'version', 'status', 'decided_at')
    list_filter = ('status', 'proposal_type', 'version')
    search_fields = ('title', 'group__name')


@admin.register(ProjectDeadline)
class ProjectDeadlineAdmin(admin.ModelAdmin):
    list_display = ('track', 'deadline_type', 'title', 'due_date', 'set_by')
    list_filter = ('deadline_type', 'track')
    search_fields = ('title', 'track__title')


@admin.register(ProjectSession)
class ProjectSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'track', 'session_type', 'target_section', 'scheduled_date', 'start_time', 'venue', 'coordinator', 'is_completed')
    list_filter = ('session_type', 'target_section', 'is_completed', 'track')
    search_fields = ('title', 'venue', 'track__title')


@admin.register(SessionAttendance)
class SessionAttendanceAdmin(admin.ModelAdmin):
    list_display = ('session', 'group', 'status', 'marked_by', 'marked_at')
    list_filter = ('status', 'session__session_type')
    search_fields = ('group__name', 'session__title')

