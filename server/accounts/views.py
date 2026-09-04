from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from core.permissions import IsSupervisor
from .models import AcademicSession, SupervisorProfile
from .serializers import (
    AcademicSessionSerializer,
    SupervisorMarketplaceSerializer,
    SupervisorProfileUpdateSerializer,
)


class SupervisorMarketplaceListView(generics.ListAPIView):
    """
    GET /api/accounts/supervisors/
    Lists all faculty supervisors with dynamic capacity calculation.
    Supports query filters:
      - ?domain=AI / ML
      - ?tech=Python
      - ?department=Computer Applications
      - ?accepting_only=true
      - ?search=Sharma
    """
    serializer_class   = SupervisorMarketplaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SupervisorProfile.objects.select_related('user').prefetch_related('supervised_groups').all()

        domain         = self.request.query_params.get('domain')
        tech           = self.request.query_params.get('tech')
        department     = self.request.query_params.get('department')
        accepting_only = self.request.query_params.get('accepting_only')
        search         = self.request.query_params.get('search')

        if domain:
            # Query JSONB array for domain match
            queryset = queryset.filter(expertise_domains__contains=[domain])
        if tech:
            # Query JSONB array for technology match
            queryset = queryset.filter(expertise_tech__contains=[tech])
        if department:
            queryset = queryset.filter(department__iexact=department)
        if accepting_only and accepting_only.lower() in ['true', '1']:
            queryset = queryset.filter(is_accepting=True)
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(
                user__last_name__icontains=search
            ) | queryset.filter(
                designation__icontains=search
            )

        return queryset.order_by('user__first_name')


class SupervisorDetailView(generics.RetrieveAPIView):
    """
    GET /api/accounts/supervisors/<pk>/
    Returns complete profile of a specific supervisor.
    """
    queryset           = SupervisorProfile.objects.select_related('user').prefetch_related('supervised_groups').all()
    serializer_class   = SupervisorMarketplaceSerializer
    permission_classes = [IsAuthenticated]


class SupervisorProfileMeView(generics.RetrieveUpdateAPIView):
    """
    GET / PATCH /api/accounts/supervisor/me/
    Allows logged-in supervisor to view and update their capacity,
    expertise tags, bio, and intake toggle.
    """
    serializer_class   = SupervisorProfileUpdateSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]

    def get_object(self):
        try:
            return self.request.user.supervisor_profile
        except SupervisorProfile.DoesNotExist:
            raise NotFound("Supervisor profile not found for current user.")


class CurrentAcademicSessionView(generics.RetrieveAPIView):
    """
    GET /api/accounts/session/current/
    Returns currently active university academic session.
    """
    serializer_class   = AcademicSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        session = AcademicSession.objects.filter(is_active=True).first()
        if not session:
            raise NotFound("No active academic session configured.")
        return session
