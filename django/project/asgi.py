"""
ASGI config for project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chatapp.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from game.routing import websocket_urlpatterns as game_websocket_urlpatterns
from users.routing import websocket_urlpatterns as user_websocket_urlpatterns


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # Just HTTP for now. (We can add other protocols later.)
	"websocket": AuthMiddlewareStack(
		URLRouter(
			chat_websocket_urlpatterns +
			game_websocket_urlpatterns +
			user_websocket_urlpatterns
        )
    ),
})
