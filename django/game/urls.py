from django.urls import path
from . import views

urlpatterns = [
	path('match/<str:mode>/', views.match, name='match'),
	path('match/remote/<str:match_id>/', views.remote_match, name='remote_match'),
	path('waiting/', views.waiting, name='waiting'),
	path('tournament_room/', views.tournament_room, name='tournament_room'),
]
