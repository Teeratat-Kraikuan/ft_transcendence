from django.urls import path
from . import views

urlpatterns = [
	# Authentication & User Management
	path('v1/register/', views.register),
	path('v1/login/', views.login),
	path('v1/logout/', views.logout),
	path('v1/change-password/', views.change_password),
	path('v1/change-username/', views.change_username),

	# Profile Management
	path('v1/profile/<int:user_id>/', views.profile),
]
