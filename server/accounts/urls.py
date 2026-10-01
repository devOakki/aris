from django.urls import path
from .views import (
    SupervisorMarketplaceListView,
    SupervisorDetailView,
    SupervisorProfileMeView,
    CurrentAcademicSessionView,
    AcademicSessionListView,
)
from .otp_views import SendOTPView, VerifyOTPView

urlpatterns = [
    path('supervisors/', SupervisorMarketplaceListView.as_view(), name='supervisor_marketplace_list'),
    path('supervisors/<uuid:pk>/', SupervisorDetailView.as_view(), name='supervisor_detail'),
    path('supervisor/me/', SupervisorProfileMeView.as_view(), name='supervisor_profile_me'),
    path('session/current/', CurrentAcademicSessionView.as_view(), name='current_academic_session'),
    path('sessions/', AcademicSessionListView.as_view(), name='academic_sessions_list'),
    path('otp/send/', SendOTPView.as_view(), name='otp_send'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),
]
