from django.urls import path
from .consumers import OnlineStatusConsumer

websocket_urlpatterns = [
	path('ws/users/online/', OnlineStatusConsumer.as_asgi()),
]