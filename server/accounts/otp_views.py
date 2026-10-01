import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError

from django.conf import settings
from .models import EmailOTPVerification
from core.email_service import send_institutional_otp_email


class SendOTPView(generics.GenericAPIView):
    """
    POST /api/accounts/otp/send/
    Dispatches a 6-digit verification code to the given institutional email.
    Enforces a 60-second cooldown per email.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        raw_email = request.data.get('email', '')
        full_name = request.data.get('full_name', '')

        if not raw_email or '@' not in raw_email:
            raise ValidationError({'email': 'A valid institutional email address is required.'})

        email = raw_email.strip().lower()

        # Cooldown check: 30 seconds
        cooldown_threshold = timezone.now() - timedelta(seconds=30)
        recent_otp = EmailOTPVerification.objects.filter(
            email=email,
            created_at__gte=cooldown_threshold
        ).first()

        if recent_otp:
            remaining_cooldown = max(1, int(30 - (timezone.now() - recent_otp.created_at).total_seconds()))
            return Response({
                'detail': f'Verification code already dispatched. Please wait {remaining_cooldown}s before requesting a new code.',
                'cooldown_seconds': remaining_cooldown,
                'email_dispatched': True,
            }, status=status.HTTP_200_OK)

        # Generate cryptographically strong 6-digit OTP
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        expires_at = timezone.now() + timedelta(minutes=10)

        EmailOTPVerification.objects.create(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at,
            attempts=0,
            is_verified=False
        )

        # Dispatch real email
        email_sent, error_msg = send_institutional_otp_email(
            to_email=email,
            otp_code=otp_code,
            full_name=full_name
        )

        if email_sent:
            return Response({
                'detail': f'Official verification code dispatched to {email}. Please check your inbox.',
                'cooldown_seconds': 30,
                'email_dispatched': True,
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'detail': f'Failed to dispatch email to {email}: {error_msg or "Check SMTP configuration"}.',
                'email_dispatched': False,
                'error': error_msg,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class VerifyOTPView(generics.GenericAPIView):
    """
    POST /api/accounts/otp/verify/
    Validates the 6-digit OTP submitted by the user.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        raw_email = request.data.get('email', '')
        otp_code = request.data.get('otp', '')

        if not raw_email or not otp_code:
            raise ValidationError({'detail': 'Email and OTP code are required.'})

        email = raw_email.strip().lower()
        otp = str(otp_code).strip()

        # Find latest pending OTP record
        record = EmailOTPVerification.objects.filter(
            email=email,
            is_verified=False
        ).order_by('-created_at').first()

        if not record:
            return Response(
                {'detail': 'No active verification code found for this email. Please request a code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if record.expires_at < timezone.now():
            return Response(
                {'detail': 'Verification code has expired. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if record.attempts >= 5:
            return Response(
                {'detail': 'Maximum verification attempts exceeded. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if record.otp_code != otp:
            record.attempts += 1
            record.save(update_fields=['attempts'])
            remaining = max(0, 5 - record.attempts)
            return Response(
                {'detail': f'Invalid verification code. {remaining} attempt(s) remaining.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Success: mark verified
        record.is_verified = True
        record.save(update_fields=['is_verified'])

        return Response({
            'detail': 'Email address verified successfully.',
            'is_verified': True
        }, status=status.HTTP_200_OK)
