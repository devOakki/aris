from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CustomTokenObtainPairSerializer,
    StudentRegisterSerializer,
    CurrentUserDetailSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class StudentRegisterView(generics.CreateAPIView):
    serializer_class   = StudentRegisterSerializer
    permission_classes = [AllowAny]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class   = CurrentUserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
