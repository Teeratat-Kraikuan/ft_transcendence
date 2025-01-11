from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        if request.path.startswith('/admin/'):
            return None

        token = request.COOKIES.get('access_token')
        if not token:
            print("Authentication failed: No token found in cookies.")
            return None

        try:
            validated_token = self.get_validated_token(token)

            user = self.get_user(validated_token)

            if not user or not user.is_active:
                print("Authentication failed: Invalid or inactive user.")
                raise exceptions.AuthenticationFailed(
                    detail="Invalid or inactive user",
                    code="invalid_user"
                )

            return (user, validated_token)
        except exceptions.AuthenticationFailed as e:
            print(f"Authentication failed: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error during authentication: {e}")
            return None