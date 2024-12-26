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
	path('v1/agree_privacy/', views.agree_privacy),
	path('v1/change-2fa/', views.change_2fa),

	# Profile Management
	path('v1/profile/<str:username>/', views.profile),

	# friend request
	path('v1/friend_request/send/', views.send_friend_request, name='send_friend_request'),
    path('v1/friend_request/accept/', views.accept_friend_request, name='accept_friend_request'),
    path('v1/friend_request/decline/', views.decline_friend_request, name='decline_friend_request'),
    
	# game
    path('v1/game/entry_online_game/', views.entry_online_game, name='entry_online_game'),

    # Notification endpoints
    path('v1/notifications/', views.list_notifications, name='list_notifications'),
    path('v1/notifications/mark-as-read/', views.mark_notification_as_read, name='mark_notification_as_read'),
	path('v1/notifications/remove/', views.remove_notification, name='remove_notification'),
]
