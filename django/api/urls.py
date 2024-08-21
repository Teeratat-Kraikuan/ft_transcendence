from django.urls import path
from . import views

urlpatterns = [
	path('v1/login/', views.login),
	path('v1/logout/', views.logout),
	path('v1/register/', views.register),
	path('v1/profile/', views.profile),
]
