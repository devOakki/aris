from rest_framework import serializers
from .models import AcademicSession, StudentProfile, SupervisorProfile


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ('id', 'year', 'term', 'is_active', 'created_at')


class SupervisorMarketplaceSerializer(serializers.ModelSerializer):
    full_name       = serializers.CharField(source='user.get_full_name', read_only=True)
    email           = serializers.EmailField(source='user.email', read_only=True)
    university_id   = serializers.CharField(source='user.university_id', read_only=True)
    avatar_url      = serializers.URLField(source='user.avatar_url', read_only=True)
    active_groups   = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()

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
            'is_accepting',
            'bio',
        )

    def get_active_groups(self, obj):
        # Exclude rejected groups from counting against capacity
        return obj.supervised_groups.exclude(status='PROPOSAL_REJECTED').count()

    def get_available_slots(self, obj):
        active = self.get_active_groups(obj)
        return max(0, obj.max_groups - active)


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
