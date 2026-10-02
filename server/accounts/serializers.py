from rest_framework import serializers
from .models import AcademicSession, StudentProfile, SupervisorProfile, School, Department
from core.models import CustomUser


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ('id', 'year', 'term', 'is_active', 'created_at')


class SupervisorMarketplaceSerializer(serializers.ModelSerializer):
    full_name       = serializers.CharField(source='user.get_full_name', read_only=True)
    email           = serializers.EmailField(source='user.email', read_only=True)
    university_id   = serializers.CharField(source='user.university_id', read_only=True)
    avatar_url      = serializers.URLField(source='user.avatar_url', read_only=True)
    max_groups      = serializers.SerializerMethodField()
    active_groups   = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    is_quota_full   = serializers.SerializerMethodField()

    class Meta:
        model = SupervisorProfile
        fields = (
            'id',
            'university_id',
            'full_name',
            'email',
            'avatar_url',
            'designation',
            'department',
            'expertise_domains',
            'expertise_tech',
            'max_groups',
            'active_groups',
            'available_slots',
            'is_quota_full',
            'is_accepting',
            'bio',
        )

    def get_max_groups(self, obj):
        return obj.max_groups or 10

    def get_active_groups(self, obj):
        return obj.supervised_groups.exclude(status='PROPOSAL_REJECTED').count()

    def get_available_slots(self, obj):
        max_g = self.get_max_groups(obj)
        active = self.get_active_groups(obj)
        return max(0, max_g - active)

    def get_is_quota_full(self, obj):
        max_g = self.get_max_groups(obj)
        active = self.get_active_groups(obj)
        return (active >= max_g) or (not obj.is_accepting)


class SupervisorProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisorProfile
        fields = (
            'designation',
            'department',
            'expertise_domains',
            'expertise_tech',
            'max_groups',
            'is_accepting',
            'bio',
        )


class StudentProfileSerializer(serializers.ModelSerializer):
    full_name     = serializers.CharField(source='user.get_full_name', read_only=True)
    university_id = serializers.CharField(source='user.university_id', read_only=True)
    email         = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id',
            'university_id',
            'full_name',
            'email',
            'program',
            'department',
            'semester',
            'created_at',
        )


class UserCredentialSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'university_id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'role',
            'avatar_url',
            'is_active',
            'created_at',
        )


class PublicDepartmentSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_code = serializers.CharField(source='school.code', read_only=True)

    class Meta:
        model = Department
        fields = ('id', 'name', 'code', 'school_id', 'school_name', 'school_code')


class DepartmentDetailSerializer(serializers.ModelSerializer):
    hods = UserCredentialSummarySerializer(many=True, read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_code = serializers.CharField(source='school.code', read_only=True)

    class Meta:
        model = Department
        fields = (
            'id',
            'school',
            'school_name',
            'school_code',
            'name',
            'code',
            'hods',
            'created_at',
        )


class SchoolDetailSerializer(serializers.ModelSerializer):
    dean = UserCredentialSummarySerializer(read_only=True)
    departments = DepartmentDetailSerializer(many=True, read_only=True)
    departments_count = serializers.IntegerField(source='departments.count', read_only=True)

    class Meta:
        model = School
        fields = (
            'id',
            'name',
            'code',
            'dean',
            'departments',
            'departments_count',
            'created_at',
        )


class CreateSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ('id', 'name', 'code', 'created_at')

    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("School name cannot be blank.")
        return val

    def validate_code(self, value):
        val = value.strip().upper()
        if not val:
            raise serializers.ValidationError("School short code cannot be blank.")
        return val


class CreateDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'name', 'code', 'created_at')

    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Department name cannot be blank.")
        return val

