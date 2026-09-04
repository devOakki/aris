from rest_framework import serializers
from django.utils import timezone
from .models import ProjectSubmission
from projects.models import StudentGroup


class ProjectSubmissionSerializer(serializers.ModelSerializer):
    group_name  = serializers.CharField(source='group.name', read_only=True)
    track_title = serializers.CharField(source='group.track.title', read_only=True)
    is_complete = serializers.SerializerMethodField()

    class Meta:
        model = ProjectSubmission
        fields = (
            'id',
            'group',
            'group_name',
            'track_title',
            'github_repo_url',
            'live_demo_url',
            'synopsis_url',
            'ppt_url',
            'report_url',
            'research_paper_url',
            'media_urls',
            'custom_deliverables',
            'github_submitted_at',
            'synopsis_submitted_at',
            'ppt_submitted_at',
            'report_submitted_at',
            'media_submitted_at',
            'all_completed_at',
            'is_complete',
            'created_at',
            'updated_at',
        )

    def get_is_complete(self, obj):
        return bool(obj.all_completed_at is not None)


class ProjectSubmissionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSubmission
        fields = (
            'github_repo_url',
            'live_demo_url',
            'synopsis_url',
            'ppt_url',
            'report_url',
            'research_paper_url',
            'media_urls',
            'custom_deliverables',
        )

    def validate_media_urls(self, value):
        track = self.instance.group.track
        if value and (len(value) < track.min_media_files or len(value) > track.max_media_files):
            raise serializers.ValidationError(
                f"This track requires between {track.min_media_files} and {track.max_media_files} screenshots/photos. You provided {len(value)}."
            )
        return value

    def update(self, instance, validated_data):
        now = timezone.now()

        # Update timestamps dynamically for modified fields
        if 'github_repo_url' in validated_data and validated_data['github_repo_url'] != instance.github_repo_url:
            instance.github_submitted_at = now
        if 'synopsis_url' in validated_data and validated_data['synopsis_url'] != instance.synopsis_url:
            instance.synopsis_submitted_at = now
        if 'ppt_url' in validated_data and validated_data['ppt_url'] != instance.ppt_url:
            instance.ppt_submitted_at = now
        if 'report_url' in validated_data and validated_data['report_url'] != instance.report_url:
            instance.report_submitted_at = now
        if 'media_urls' in validated_data and validated_data['media_urls'] != instance.media_urls:
            instance.media_submitted_at = now

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Check if all required deliverables are completed
        required = instance.group.track.required_deliverables
        checks = []
        if "SYNOPSIS" in required: checks.append(bool(instance.synopsis_url))
        if "PPT" in required: checks.append(bool(instance.ppt_url))
        if "REPORT" in required: checks.append(bool(instance.report_url))
        if "GITHUB" in required: checks.append(bool(instance.github_repo_url))
        if "MEDIA" in required: checks.append(bool(len(instance.media_urls) >= instance.group.track.min_media_files))

        if checks and all(checks):
            instance.all_completed_at = now
            # Automatically update group status to SUBMITTED
            instance.group.status = StudentGroup.Status.SUBMITTED
            instance.group.save()

        instance.save()
        return instance
