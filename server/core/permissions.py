from rest_framework.permissions import BasePermission
from .models import CustomUser


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.Role.STUDENT)


class IsSupervisor(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return bool(
            request.user.role in [CustomUser.Role.SUPERVISOR, CustomUser.Role.HOD, CustomUser.Role.DEAN] or
            hasattr(request.user, 'supervisor_profile')
        )


class IsHOD(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return bool(
            request.user.role == CustomUser.Role.HOD or
            request.user.managed_departments.exists()
        )


class IsDean(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return bool(
            request.user.role == CustomUser.Role.DEAN or
            (hasattr(request.user, 'managed_school') and request.user.managed_school is not None)
        )


class IsHODOrDean(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return bool(
            request.user.role in [CustomUser.Role.HOD, CustomUser.Role.DEAN] or
            request.user.managed_departments.exists() or
            (hasattr(request.user, 'managed_school') and request.user.managed_school is not None)
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.role == CustomUser.Role.ADMIN or request.user.is_staff or request.user.is_superuser)
        )

