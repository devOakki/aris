from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for listing and reading user notifications.
    Includes triggered_by details and relative human-readable timestamp metadata.
    """
    triggered_by_name = serializers.CharField(source='triggered_by.get_full_name', read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id',
            'event_type',
            'title',
            'message',
            'target_url',
            'is_read',
            'triggered_by',
            'triggered_by_name',
            'created_at',
        )
        read_only_fields = (
            'id',
            'event_type',
            'title',
            'message',
            'target_url',
            'triggered_by',
            'triggered_by_name',
            'created_at',
        )


class NotificationMarkReadSerializer(serializers.ModelSerializer):
    """
    Serializer to toggle notification read status.
    """
    class Meta:
        model = Notification
        fields = ('is_read',)
