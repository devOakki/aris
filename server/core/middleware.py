"""
ARIS Security Middleware — Adds hardened HTTP security headers to every response.
Addresses OWASP A05:2021 Security Misconfiguration.
"""


class SecurityHeadersMiddleware:
    """
    Injects Content-Security-Policy, X-XSS-Protection, X-Content-Type-Options,
    Referrer-Policy, and Permissions-Policy headers into all HTTP responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Reject oversized requests immediately with 413 (DoS / Payload protection)
        content_length = request.META.get('CONTENT_LENGTH')
        if content_length:
            try:
                length = int(content_length)
                content_type = request.META.get('CONTENT_TYPE', '')
                if 'multipart/form-data' not in content_type and length > 200 * 1024:
                    from django.http import JsonResponse
                    return JsonResponse({'detail': 'Request entity too large.'}, status=413)
            except (ValueError, TypeError):
                pass

        response = self.get_response(request)

        # Content-Security-Policy: Restrict resource loading to same origin
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://res.cloudinary.com; "
            "connect-src 'self' http://127.0.0.1:8000 http://localhost:3000; "
            "frame-ancestors 'none';"
        )

        # X-XSS-Protection: Enable browser's built-in XSS filter
        response['X-XSS-Protection'] = '1; mode=block'

        # X-Content-Type-Options: Prevent MIME-type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # X-Frame-Options: Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'

        # Strict-Transport-Security: Enforce HTTPS connections
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        # Referrer-Policy: Don't leak full URL on external navigation
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy: Disable unnecessary browser features
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), '
            'payment=(), usb=(), magnetometer=()'
        )

        return response
