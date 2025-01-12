from datetime import timedelta
from django.utils.timezone import now
from django.contrib.sessions.models import Session
from django.utils.deprecation import MiddlewareMixin
from django.utils.dateparse import parse_datetime
from django.contrib.auth.models import AnonymousUser
from django.utils.functional import SimpleLazyObject
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from django.contrib.auth import get_user_model
import jwt

User = get_user_model()

class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            request.user.profile.last_activity = now()
            request.user.profile.save()
        return response
    
def get_user_from_jwt(request):
    token = request.COOKIES.get('access_token')
    if not token:
        return AnonymousUser()

    try:
        payload = jwt.decode(
            token,
            settings.SIMPLE_JWT['SIGNING_KEY'],
            algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
        )
        user_id = payload.get('user_id')
        if not user_id:
            return AnonymousUser()
        
        user = User.objects.get(id=user_id)
        return user
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        return AnonymousUser()

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/admin/'):
            return self.get_response(request)
        request.user = SimpleLazyObject(lambda: get_user_from_jwt(request))
        return self.get_response(request)