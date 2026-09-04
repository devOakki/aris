from django.urls import path
from .views import (
    SupervisorMarketplaceListView,
    SupervisorDetailView,
    SupervisorProfileMeView,
    CurrentAcademicSessionView,
)

urlpatterns = [
    path('supervisors/', SupervisorMarketplaceListView.as_view(), name='supervisor_marketplace_list'),
    path('supervisors/<uuid:pk>/', SupervisorDetailView.as_view(), name='supervisor_detail'),
    path('supervisor/me/', SupervisorProfileMeView.as_view(), name='supervisor_profile_me'),
    path('session/current/', CurrentAcademicSessionView.as_view(), name='current_academic_session'),
]
