from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from .models import CustomUser
from accounts.models import StudentProfile, SupervisorProfile


class UserSummarySerializer(serializers.ModelSerializer):
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
            'role',
            'department',
            'avatar_url',
            'is_active',
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['university_id'] = user.university_id
        token['role'] = user.role
        token['department'] = user.department
        token['full_name'] = user.get_full_name()
        return token

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        if username:
            user = CustomUser.objects.filter(university_id=str(username).strip().upper()).first()
            if user and user.role == CustomUser.Role.SUPERVISOR:
                supervisor_profile = getattr(user, 'supervisor_profile', None)
                if supervisor_profile:
                    if supervisor_profile.approval_status == SupervisorProfile.ApprovalStatus.PENDING:
                        raise serializers.ValidationError(
                            {"detail": "Your faculty registration has been submitted to the Head of Department (HOD) for institutional verification. Your credentials will become active once approved."}
                        )
                    elif supervisor_profile.approval_status == SupervisorProfile.ApprovalStatus.REJECTED:
                        reason_note = f" Reason: {supervisor_profile.rejection_reason}" if supervisor_profile.rejection_reason else ""
                        raise serializers.ValidationError(
                            {"detail": f"Your faculty supervisor application was declined by the HOD.{reason_note}"}
                        )

        data = super().validate(attrs)
        data['user'] = UserSummarySerializer(self.user).data
        return data


class InstitutionalRegisterSerializer(serializers.ModelSerializer):
    password          = serializers.CharField(write_only=True, min_length=6)
    role              = serializers.ChoiceField(choices=CustomUser.Role.choices, default=CustomUser.Role.STUDENT, required=False)
    program           = serializers.CharField(write_only=True, max_length=50, required=False, allow_blank=True)
    semester          = serializers.IntegerField(write_only=True, min_value=1, max_value=8, required=False)
    designation       = serializers.CharField(write_only=True, max_length=100, required=False, allow_blank=True)
    max_groups        = serializers.IntegerField(write_only=True, min_value=1, max_value=20, required=False, default=5)
    expertise_domains = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    expertise_tech    = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    avatar_url        = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = CustomUser
        fields = (
            'university_id',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'role',
            'department',
            'program',
            'semester',
            'designation',
            'max_groups',
            'expertise_domains',
            'expertise_tech',
            'avatar_url',
        )

    def validate(self, attrs):
        role = attrs.get('role', CustomUser.Role.STUDENT)
        if role == CustomUser.Role.STUDENT:
            if not attrs.get('program'):
                raise serializers.ValidationError({'program': 'Academic program is mandatory for student registration.'})
            if not attrs.get('semester'):
                raise serializers.ValidationError({'semester': 'Current semester is mandatory for student registration.'})
        elif role == CustomUser.Role.SUPERVISOR:
            if not attrs.get('designation'):
                raise serializers.ValidationError({'designation': 'Faculty designation is mandatory.'})
        return attrs

    def create(self, validated_data):
        role              = validated_data.pop('role', CustomUser.Role.STUDENT)
        password          = validated_data.pop('password')
        program           = validated_data.pop('program', '')
        semester          = validated_data.pop('semester', None)
        designation       = validated_data.pop('designation', 'Assistant Professor')
        max_groups        = validated_data.pop('max_groups', 5)
        expertise_domains = validated_data.pop('expertise_domains', [])
        expertise_tech    = validated_data.pop('expertise_tech', [])
        avatar_url        = validated_data.pop('avatar_url', '')

        with transaction.atomic():
            if role == CustomUser.Role.SUPERVISOR:
                # Faculty supervisor is set to is_active=False until HOD approves
                user = CustomUser.objects.create_user(
                    password=password,
                    role=CustomUser.Role.SUPERVISOR,
                    is_active=False,
                    avatar_url=avatar_url,
                    **validated_data
                )
                SupervisorProfile.objects.create(
                    user=user,
                    designation=designation,
                    department=user.department,
                    max_groups=max_groups,
                    expertise_domains=expertise_domains,
                    expertise_tech=expertise_tech,
                    approval_status=SupervisorProfile.ApprovalStatus.PENDING,
                )
            else:
                user = CustomUser.objects.create_user(
                    password=password,
                    role=CustomUser.Role.STUDENT,
                    is_active=True,
                    avatar_url=avatar_url,
                    **validated_data
                )
                StudentProfile.objects.create(
                    user=user,
                    program=program,
                    department=user.department,
                    semester=semester or 1,
                )
        return user


# Backward-compatibility alias
StudentRegisterSerializer = InstitutionalRegisterSerializer


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ('id', 'program', 'department', 'semester', 'created_at')


class SupervisorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisorProfile
        fields = (
            'id',
            'designation',
            'department',
            'expertise_domains',
            'expertise_tech',
            'max_groups',
            'is_accepting',
            'approval_status',
            'rejection_reason',
            'approved_at',
            'bio',
        )


class CurrentUserDetailSerializer(serializers.ModelSerializer):
    full_name          = serializers.CharField(source='get_full_name', read_only=True)
    student_profile    = StudentProfileSerializer(read_only=True)
    supervisor_profile = SupervisorProfileSerializer(read_only=True)

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
            'department',
            'avatar_url',
            'is_active',
            'student_profile',
            'supervisor_profile',
            'created_at',
        )
