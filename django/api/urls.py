from django.urls import path
from . import views

urlpatterns = [
	# Authentication & User Management
	path('v1/register/', views.register),
	path('v1/login/', views.login),
	path('v1/logout/', views.logout),
	path('v1/change-password/', views.change_password),
	path('v1/change-username/', views.change_username),
	path('v1/edit_user_profile/', views.edit_user_profile),

	# Profile Management
	path('v1/profile/<str:username>/', views.profile),
]
