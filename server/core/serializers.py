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
        data = super().validate(attrs)
        data['user'] = UserSummarySerializer(self.user).data
        return data


class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    program  = serializers.CharField(write_only=True, max_length=50)
    semester = serializers.IntegerField(write_only=True, min_value=1, max_value=8)

    class Meta:
        model = CustomUser
        fields = (
            'university_id',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'department',
            'program',
            'semester',
        )

    def create(self, validated_data):
        program  = validated_data.pop('program')
        semester = validated_data.pop('semester')
        password = validated_data.pop('password')

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                password=password,
                role=CustomUser.Role.STUDENT,
                **validated_data
            )
            StudentProfile.objects.create(
                user=user,
                program=program,
                department=user.department,
                semester=semester,
            )
        return user


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
