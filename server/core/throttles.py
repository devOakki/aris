"""
ARIS Custom DRF Throttle Classes — Per-endpoint rate limiting.
Addresses OWASP A07:2021 Identification and Authentication Failures.
"""
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Limits login attempts to 5/minute per IP address.
    Prevents brute-force password guessing attacks.
    """
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """
    Limits registration attempts to 3/minute per IP address.
    Prevents automated account creation spam / bot floods.
    """
    scope = 'register'


class PortraitUploadRateThrottle(AnonRateThrottle):
    """
    Limits portrait uploads to 5/minute per IP address.
    Prevents storage abuse via Cloudinary.
    """
    scope = 'portrait_upload'
