from django.contrib import admin
from .models import AcademicSession, StudentProfile, SupervisorProfile


@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ('year', 'term', 'is_active', 'set_by', 'created_at')
    list_filter = ('is_active', 'term')
    search_fields = ('year',)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'program', 'department', 'semester', 'created_at')
    list_filter = ('program', 'department', 'semester')
    search_fields = ('user__university_id', 'user__first_name', 'user__last_name', 'user__email')


@admin.register(SupervisorProfile)
class SupervisorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'designation', 'department', 'max_groups', 'is_accepting', 'created_at')
    list_filter = ('department', 'designation', 'is_accepting')
    search_fields = ('user__university_id', 'user__first_name', 'user__last_name', 'user__email')
