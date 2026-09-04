from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationMarkReadSerializer,
)


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Lists all notifications for the currently authenticated user.
    Supports query parameter:
      - ?unread_only=true
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user).select_related('triggered_by')

        if self.request.query_params.get('unread_only', '').lower() == 'true':
            queryset = queryset.filter(is_read=False)

        return queryset.order_by('-created_at')


class NotificationMarkReadView(generics.UpdateAPIView):
    """
    PATCH /api/notifications/<uuid:pk>/read/
    Marks an individual notification as read.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationMarkReadSerializer

    def get_object(self):
        try:
            return Notification.objects.get(id=self.kwargs['pk'], recipient=self.request.user)
        except Notification.DoesNotExist:
            raise NotFound("Notification not found.")

    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(generics.GenericAPIView):
    """
    POST /api/notifications/mark-all-read/
    Marks all notifications for the authenticated user as read in a single call.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"detail": f"Marked {count} notifications as read."}, status=status.HTTP_200_OK)
