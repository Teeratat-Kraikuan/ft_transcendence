from django.urls import path
from . import views

urlpatterns = [
	path('v1/login/', views.login, name=''),
	path('v1/profile/', views.profile, name=''),
]
