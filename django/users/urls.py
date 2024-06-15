from django.urls import path, include
from users import views

urlpatterns = [
	path('callback/', views.callback, name='callback'),
	path('send_friend_request/<int:userID>/', views.send_friend_request, name='send friend request'),
	path('accept_friend_request/<int:requestID>/', views.accept_friend_request, name='accept friend request'),
	path('friend/', views.friend, name='friend'),
	path('<str:username>/', views.profile, name='profile'),
]