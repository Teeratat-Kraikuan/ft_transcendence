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
	path('v1/profile/<str:username>/', views.profile),

	# friend request
	path('v1/friend_request/send/', views.send_friend_request, name='send_friend_request'),
    path('v1/friend_request/accept/', views.accept_friend_request, name='accept_friend_request'),
    path('v1/friend_request/decline/', views.decline_friend_request, name='decline_friend_request'),

    # Notification endpoints
    path('v1/notifications/', views.list_notifications, name='list_notifications'),
    path('v1/notifications/mark-as-read/', views.mark_notification_as_read, name='mark_notification_as_read'),
	path('v1/notifications/remove/', views.remove_notification, name='remove_notification'),
]
