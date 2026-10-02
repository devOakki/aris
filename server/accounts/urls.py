from django.urls import path
from .views import (
    SupervisorMarketplaceListView,
    SupervisorDetailView,
    SupervisorProfileMeView,
    CurrentAcademicSessionView,
    AcademicSessionListView,
    PublicDepartmentListView,
    AdminFacultyApprovalListView,
    AdminFacultyApprovalActionView,
    AdminEligibleFacultyListView,
    AdminSchoolListCreateView,
    AdminSchoolDetailView,
    AdminDepartmentCreateView,
    AdminDepartmentDetailView,
    AdminAssignDeanView,
    AdminAddHodView,
    AdminRemoveHodView,
    AdminToggleCredentialStatusView,
)
from .otp_views import SendOTPView, VerifyOTPView

urlpatterns = [
    path('supervisors/', SupervisorMarketplaceListView.as_view(), name='supervisor_marketplace_list'),
    path('supervisors/<uuid:pk>/', SupervisorDetailView.as_view(), name='supervisor_detail'),
    path('supervisor/me/', SupervisorProfileMeView.as_view(), name='supervisor_profile_me'),
    path('session/current/', CurrentAcademicSessionView.as_view(), name='current_academic_session'),
    path('sessions/', AcademicSessionListView.as_view(), name='academic_sessions_list'),
    path('departments/', PublicDepartmentListView.as_view(), name='public_departments_list'),
    path('otp/send/', SendOTPView.as_view(), name='otp_send'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),

    # Admin Credential & Hierarchy Management
    path('admin/schools/', AdminSchoolListCreateView.as_view(), name='admin_schools_list_create'),
    path('admin/schools/<int:school_id>/', AdminSchoolDetailView.as_view(), name='admin_school_detail'),
    path('admin/schools/<int:school_id>/departments/', AdminDepartmentCreateView.as_view(), name='admin_department_create'),
    path('admin/schools/<int:school_id>/assign-dean/', AdminAssignDeanView.as_view(), name='admin_assign_dean'),
    path('admin/departments/<int:department_id>/', AdminDepartmentDetailView.as_view(), name='admin_department_detail'),
    path('admin/departments/<int:department_id>/add-hod/', AdminAddHodView.as_view(), name='admin_add_hod'),
    path('admin/departments/<int:department_id>/remove-hod/', AdminRemoveHodView.as_view(), name='admin_remove_hod'),
    path('admin/users/<uuid:user_id>/toggle-status/', AdminToggleCredentialStatusView.as_view(), name='admin_toggle_user_status'),

    # Admin Faculty Approvals & RBAC Eligibility
    path('admin/faculty-approvals/', AdminFacultyApprovalListView.as_view(), name='admin_faculty_approvals_list'),
    path('admin/faculty-approvals/<int:supervisor_id>/action/', AdminFacultyApprovalActionView.as_view(), name='admin_faculty_approval_action'),
    path('admin/eligible-faculty/', AdminEligibleFacultyListView.as_view(), name='admin_eligible_faculty_list'),
]
