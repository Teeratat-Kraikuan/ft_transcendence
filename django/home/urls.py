from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name=''),
	path('home/', views.home, name='home'),
	path('online/', views.online, name='online'),
	path('tournament/', views.tournament, name='tournament'),
	path('tournament_queue/', views.tournament_queue, name='tournament_queue'),
	path('offline/', views.offline, name='offline'),
	path('community/', views.community, name='community')
]
