from datetime import timedelta
from django.utils.timezone import now
from django.contrib.sessions.models import Session
from django.utils.deprecation import MiddlewareMixin
from django.utils.dateparse import parse_datetime  # Import to parse datetime strings


class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            # Update last activity timestamp
            request.user.profile.last_activity = now()
            request.user.profile.save()  # Save the Profile, not the User
        return response