from django.urls import path
from . import views

urlpatterns = [
	path('users/<str:username>', views.user, name='user'),
	# path('profile', views.profile, name='profile')
]
