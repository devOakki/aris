from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CustomTokenObtainPairSerializer,
    StudentRegisterSerializer,
    CurrentUserDetailSerializer,
)
from .throttles import LoginRateThrottle, RegisterRateThrottle


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/ — Rate limited to 5 attempts/minute per IP."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


class StudentRegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Rate limited to 3 attempts/minute per IP."""
    serializer_class   = StudentRegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [RegisterRateThrottle]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class   = CurrentUserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

