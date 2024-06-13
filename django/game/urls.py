from django.urls import path
from . import views

urlpatterns = [
	path('', views.game, name='game'),
	path('pong/', views.pong, name='pong'),
	path('queue/', views.queue),
	path('tournament/', views.tournament, name='tournament'),
    path('tournament_waiting/', views.tournament_waiting, name='tournament_waiting'),
    path('tournament_pong/', views.tournament_pong, name='tournament_pong'),
]