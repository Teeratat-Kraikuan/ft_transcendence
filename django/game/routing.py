from django.urls import path
from .consumers import PongConsumer, TournamentConsumer

websocket_urlpatterns = [
	path('ws/game/tournament/<str:tournament_name>/', TournamentConsumer.as_asgi()),
	path('ws/game/<str:room_code>/<str:username>/', PongConsumer.as_asgi()),
]