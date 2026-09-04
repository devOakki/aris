from django.contrib import admin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('university_id', 'email', 'first_name', 'last_name', 'role', 'department', 'is_active', 'is_staff')
    list_filter = ('role', 'department', 'is_active', 'is_staff')
    search_fields = ('university_id', 'email', 'first_name', 'last_name')
    ordering = ('university_id',)
