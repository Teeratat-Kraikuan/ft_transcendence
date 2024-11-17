from django.urls import path
from . import views

urlpatterns = [
	path('match', views.match, name='match'),
	path('waiting', views.waiting, name='waiting'),
	path('tournament_room', views.tournament_room, name='tournament_room'),
]
