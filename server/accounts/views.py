from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from django.db import transaction, models
from django.utils import timezone
from core.permissions import IsSupervisor, IsAdmin
from core.models import CustomUser
from .models import AcademicSession, SupervisorProfile, School, Department
from approvals.serializers import (
    FacultyApprovalDossierSerializer,
    FacultyApprovalActionSerializer,
)
from .serializers import (
    AcademicSessionSerializer,
    SupervisorMarketplaceSerializer,
    SupervisorProfileUpdateSerializer,
    PublicDepartmentSerializer,
    SchoolDetailSerializer,
    DepartmentDetailSerializer,
    CreateSchoolSerializer,
    CreateDepartmentSerializer,
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


class AcademicSessionListView(generics.ListAPIView):
    """
    GET /api/accounts/sessions/
    Lists all academic sessions ordered by year and term for history audit.
    """
    serializer_class   = AcademicSessionSerializer
    permission_classes = [IsAuthenticated]
    queryset           = AcademicSession.objects.all().order_by('-year', '-term')


# ─── ADMIN CREDENTIAL & HIERARCHY MANAGEMENT ──────────────────────────

class PublicDepartmentListView(generics.ListAPIView):
    """
    GET /api/accounts/departments/ — Public endpoint for registration dropdowns.
    """
    permission_classes = [AllowAny]
    serializer_class   = PublicDepartmentSerializer
    queryset           = Department.objects.select_related('school').all().order_by('school__name', 'name')


class AdminSchoolListCreateView(APIView):
    """
    GET  /api/accounts/admin/schools/ — List all schools with dean and departments.
    POST /api/accounts/admin/schools/ — Create a new school.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        schools = School.objects.prefetch_related('departments__hods').select_related('dean').all()
        serializer = SchoolDetailSerializer(schools, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateSchoolSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school = serializer.save()
        return Response(SchoolDetailSerializer(school).data, status=status.HTTP_201_CREATED)


class AdminSchoolDetailView(APIView):
    """
    PATCH  /api/accounts/admin/schools/<school_id>/ — Edit school name / code.
    DELETE /api/accounts/admin/schools/<school_id>/ — Delete school.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, school_id):
        school = get_object_or_404(School, pk=school_id)
        name = request.data.get('name', '').strip()
        code = request.data.get('code', '').strip().upper()
        if not name:
            return Response({'name': ['School name cannot be blank.']}, status=status.HTTP_400_BAD_REQUEST)
        if not code:
            return Response({'code': ['School code cannot be blank.']}, status=status.HTTP_400_BAD_REQUEST)
        if School.objects.filter(name__iexact=name).exclude(pk=school.pk).exists():
            return Response({'name': ['A school with this name already exists.']}, status=status.HTTP_400_BAD_REQUEST)
        if School.objects.filter(code__iexact=code).exclude(pk=school.pk).exists():
            return Response({'code': ['A school with this short code already exists.']}, status=status.HTTP_400_BAD_REQUEST)
        school.name = name
        school.code = code
        school.save(update_fields=['name', 'code', 'updated_at'])
        return Response(SchoolDetailSerializer(school).data, status=status.HTTP_200_OK)

    def delete(self, request, school_id):
        school = get_object_or_404(School, pk=school_id)
        with transaction.atomic():
            # De-elevate dean if assigned
            if school.dean:
                dean = school.dean
                school.dean = None
                school.save(update_fields=['dean'])
                if not dean.managed_departments.exists():
                    dean.role = CustomUser.Role.SUPERVISOR
                else:
                    dean.role = CustomUser.Role.HOD
                dean.save(update_fields=['role'])
            # For each department under school, de-elevate HODs
            for dept in school.departments.all():
                for hod in dept.hods.all():
                    dept.hods.remove(hod)
                    if not hod.managed_departments.exists() and not (hasattr(hod, 'managed_school') and hod.managed_school):
                        hod.role = CustomUser.Role.SUPERVISOR
                        hod.save(update_fields=['role'])
            school.delete()
        return Response({'detail': 'School deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class AdminDepartmentCreateView(APIView):
    """
    POST /api/accounts/admin/schools/<school_id>/departments/ — Create a department under school.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, school_id):
        school = get_object_or_404(School, pk=school_id)
        serializer = CreateDepartmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        name = serializer.validated_data['name']
        if Department.objects.filter(school=school, name__iexact=name).exists():
            return Response({'name': [f"A department named '{name}' already exists in {school.code}."]}, status=status.HTTP_400_BAD_REQUEST)
        department = serializer.save(school=school)
        return Response(DepartmentDetailSerializer(department).data, status=status.HTTP_201_CREATED)


class AdminDepartmentDetailView(APIView):
    """
    PATCH  /api/accounts/admin/departments/<department_id>/ — Edit department name / code.
    DELETE /api/accounts/admin/departments/<department_id>/ — Delete department.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, department_id):
        department = get_object_or_404(Department, pk=department_id)
        name = request.data.get('name', '').strip()
        code = request.data.get('code', '').strip().upper()
        if not name:
            return Response({'name': ['Department name cannot be blank.']}, status=status.HTTP_400_BAD_REQUEST)
        if Department.objects.filter(school=department.school, name__iexact=name).exclude(pk=department.pk).exists():
            return Response({'name': [f"A department named '{name}' already exists in {department.school.code}."]}, status=status.HTTP_400_BAD_REQUEST)
        department.name = name
        department.code = code
        department.save(update_fields=['name', 'code', 'updated_at'])
        return Response(DepartmentDetailSerializer(department).data, status=status.HTTP_200_OK)

    def delete(self, request, department_id):
        department = get_object_or_404(Department, pk=department_id)
        with transaction.atomic():
            for hod in department.hods.all():
                department.hods.remove(hod)
                if not hod.managed_departments.exists() and not (hasattr(hod, 'managed_school') and hod.managed_school):
                    hod.role = CustomUser.Role.SUPERVISOR
                    hod.save(update_fields=['role'])
            department.delete()
        return Response({'detail': 'Department deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class AdminFacultyApprovalListView(generics.ListAPIView):
    """
    GET /api/accounts/admin/faculty-approvals/
    Admin reviews all faculty supervisor registrations across the entire university.
    Query filters:
      - ?status=PENDING (default)
      - ?status=all
      - ?status=APPROVED
      - ?status=REJECTED
      - ?search=Sharma
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = FacultyApprovalDossierSerializer

    def get_queryset(self):
        queryset = SupervisorProfile.objects.select_related('user', 'approved_by').all()
        status_filter = self.request.query_params.get('status', 'PENDING')
        if status_filter != 'all':
            queryset = queryset.filter(approval_status=status_filter.upper())
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(user__university_id__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(department__icontains=search) |
                models.Q(designation__icontains=search)
            )
        return queryset.order_by('-created_at')


class AdminFacultyApprovalActionView(generics.GenericAPIView):
    """
    POST /api/accounts/admin/faculty-approvals/<int:supervisor_id>/action/
    Admin APPROVES or REJECTS a faculty supervisor's registration.
    Payload: {"action": "APPROVE" | "REJECT", "reason": "optional reason"}
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = FacultyApprovalActionSerializer

    def post(self, request, supervisor_id, *args, **kwargs):
        try:
            supervisor = SupervisorProfile.objects.select_related('user').get(id=supervisor_id)
        except SupervisorProfile.DoesNotExist:
            raise NotFound("Supervisor application not found.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '').strip()

        with transaction.atomic():
            if action == 'APPROVE':
                supervisor.approval_status = SupervisorProfile.ApprovalStatus.APPROVED
                supervisor.approved_by = request.user
                supervisor.approved_at = timezone.now()
                supervisor.rejection_reason = ''
                supervisor.save(update_fields=['approval_status', 'approved_by', 'approved_at', 'rejection_reason'])

                user = supervisor.user
                user.is_active = True
                user.save(update_fields=['is_active'])

            elif action == 'REJECT':
                supervisor.approval_status = SupervisorProfile.ApprovalStatus.REJECTED
                supervisor.rejection_reason = reason or 'Application declined by System Administrator.'
                supervisor.save(update_fields=['approval_status', 'rejection_reason'])

                user = supervisor.user
                user.is_active = False
                user.save(update_fields=['is_active'])

        return Response(FacultyApprovalDossierSerializer(supervisor).data, status=status.HTTP_200_OK)


class AdminEligibleFacultyListView(APIView):
    """
    GET /api/accounts/admin/eligible-faculty/
    Returns all approved faculty supervisors eligible for RBAC elevation to Dean or HOD.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        supervisors = (
            SupervisorProfile.objects
            .filter(approval_status=SupervisorProfile.ApprovalStatus.APPROVED)
            .select_related('user')
            .prefetch_related('user__managed_departments__school')
            .order_by('user__first_name', 'user__last_name')
        )

        result = []
        for s in supervisors:
            user = s.user
            dean_school = None
            if hasattr(user, 'managed_school') and user.managed_school:
                dean_school = {
                    'id': user.managed_school.id,
                    'name': user.managed_school.name,
                    'code': user.managed_school.code,
                }

            hod_depts = [
                {
                    'id': d.id,
                    'name': d.name,
                    'code': d.code,
                    'school_id': d.school_id,
                    'school_name': d.school.name,
                    'school_code': d.school.code,
                }
                for d in user.managed_departments.all()
            ]

            result.append({
                'id': s.id,
                'user_id': str(user.id),
                'university_id': user.university_id,
                'full_name': user.get_full_name(),
                'email': user.email,
                'phone': user.phone,
                'department': s.department,
                'designation': s.designation,
                'role': user.role,
                'avatar_url': user.avatar_url,
                'is_active': user.is_active,
                'dean_school': dean_school,
                'hod_departments': hod_depts,
            })

        return Response(result, status=status.HTTP_200_OK)


class AdminAssignDeanView(APIView):
    """
    POST /api/accounts/admin/schools/<school_id>/assign-dean/
    Assigns an approved faculty member as Dean (elevating role to DEAN).
    Or removes the Dean (de-elevating role back to SUPERVISOR).
    Payload: {"user_id": "<uuid>"} or {"action": "REMOVE"}
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, school_id):
        school = get_object_or_404(School, pk=school_id)
        user_id = request.data.get('user_id')
        action = request.data.get('action')

        with transaction.atomic():
            if action == 'REMOVE' or not user_id:
                if school.dean:
                    prev_dean = school.dean
                    # De-elevate previous dean: if still an HOD anywhere, set to HOD; else SUPERVISOR
                    if prev_dean.managed_departments.exists():
                        prev_dean.role = CustomUser.Role.HOD
                    else:
                        prev_dean.role = CustomUser.Role.SUPERVISOR
                    prev_dean.save(update_fields=['role'])
                    school.dean = None
                    school.save(update_fields=['dean'])
                return Response(SchoolDetailSerializer(school).data, status=status.HTTP_200_OK)

            new_dean = get_object_or_404(CustomUser, pk=user_id)

            # If previous dean exists on this school and is different, de-elevate them
            if school.dean and school.dean != new_dean:
                prev_dean = school.dean
                if prev_dean.managed_departments.exists():
                    prev_dean.role = CustomUser.Role.HOD
                else:
                    prev_dean.role = CustomUser.Role.SUPERVISOR
                prev_dean.save(update_fields=['role'])

            # If new_dean was dean of another school, remove from that school
            if hasattr(new_dean, 'managed_school') and new_dean.managed_school and new_dean.managed_school != school:
                other_school = new_dean.managed_school
                other_school.dean = None
                other_school.save(update_fields=['dean'])

            # Elevate new dean (DEAN role is the primary executive role)
            new_dean.role = CustomUser.Role.DEAN
            new_dean.save(update_fields=['role'])
            school.dean = new_dean
            school.save(update_fields=['dean'])

        return Response(SchoolDetailSerializer(school).data, status=status.HTTP_200_OK)


class AdminAddHodView(APIView):
    """
    POST /api/accounts/admin/departments/<department_id>/add-hod/
    Assigns an approved faculty member as HOD (elevating role to HOD, or maintaining DEAN if already Dean).
    Payload: {"user_id": "<uuid>"}
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, department_id):
        department = get_object_or_404(Department, pk=department_id)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(CustomUser, pk=user_id)
        with transaction.atomic():
            # Elevate to HOD (unless already a DEAN; if DEAN, they retain DEAN role and gain department HOD authority)
            if user.role != CustomUser.Role.DEAN:
                user.role = CustomUser.Role.HOD
                user.save(update_fields=['role'])
            department.hods.add(user)

        return Response(DepartmentDetailSerializer(department).data, status=status.HTTP_200_OK)


class AdminRemoveHodView(APIView):
    """
    POST /api/accounts/admin/departments/<department_id>/remove-hod/
    Removes an HOD from a department (de-elevates back to SUPERVISOR if no other assignments, or DEAN if Dean).
    Payload: {"user_id": "<uuid>"}
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, department_id):
        department = get_object_or_404(Department, pk=department_id)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(CustomUser, pk=user_id)
        with transaction.atomic():
            department.hods.remove(user)
            has_other_hod = user.managed_departments.exists()
            has_dean = hasattr(user, 'managed_school') and user.managed_school is not None
            if not has_other_hod and not has_dean:
                user.role = CustomUser.Role.SUPERVISOR
                user.save(update_fields=['role'])
            elif has_dean:
                user.role = CustomUser.Role.DEAN
                user.save(update_fields=['role'])
            elif has_other_hod:
                user.role = CustomUser.Role.HOD
                user.save(update_fields=['role'])

        return Response(DepartmentDetailSerializer(department).data, status=status.HTTP_200_OK)


class AdminToggleCredentialStatusView(APIView):
    """
    PATCH /api/accounts/admin/users/<user_id>/toggle-status/ — Enable/Disable a credential.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        user = get_object_or_404(CustomUser, pk=user_id)
        if user == request.user:
            return Response({'detail': 'You cannot deactivate your own administrative account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({
            'id': str(user.id),
            'university_id': user.university_id,
            'is_active': user.is_active,
            'detail': f"Account for {user.get_full_name()} is now {'Active' if user.is_active else 'Deactivated'}."
        }, status=status.HTTP_200_OK)


