from django.urls import path
from .consumers import PongConsumer

websocket_urlpatterns = [
	path('ws/game/<str:room_code>/<str:username>/', PongConsumer.as_asgi()),
	# path('ws/game/<str:room_code>/<str:username>/', PongConsumer.as_asgi()),
]