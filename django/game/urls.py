from django.urls import path
from . import views

urlpatterns = [
	path('', views.game, name='game'),
	path('pong/', views.pong, name='pong'),
	path('pong-ai/', views.pong_ai, name='pong-ai'),
	path('pong-local/', views.pong_local, name='pong-local'),
	path('tournament/', views.tournament, name='tournament'),
    path('tournament_waiting/', views.tournament_waiting, name='tournament_waiting'),
    path('tournament_pong/', views.tournament_pong, name='tournament_pong'),
	path('match_record/', views.match_record, name='match_record'),
]