from django.urls import path, include
from users import views

urlpatterns = [
	path('callback/', views.callback, name='callback'),
	path('send_friend_request/<int:userID>/', views.send_friend_request, name='send friend request'),
	path('accept_friend_request/<int:requestID>/', views.accept_friend_request, name='accept friend request'),
	path('friend/', views.friend, name='friend'),
	path('block/<str:username>/', views.block, name='block'),
	path('unblock/<str:username>/', views.unblock, name='unblock'),
	path('<str:username>/', views.profile, name='profile'),
]