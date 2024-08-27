from django.urls import path
from . import views

urlpatterns = [
	path('login/', views.login, name='login'),
	path('login_2fa/', views.login_2fa, name='login-2fa'),
	path('signup/', views.signup, name='signup'),
	path('logout/', views.logout, name='login'),
	path('users/<int:user_id>/', views.user, name='user'),
]
