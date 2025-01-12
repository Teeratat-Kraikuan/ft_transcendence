from django.urls import path, re_path
from . import views

urlpatterns = [
	# Authentication & User Management
	path('v1/register/', views.register),
	# path('v1/login/', views.login),
	path('v2/login/', views.LoginWithJWT.as_view(), name='login_jwt'),
	# path('v1/logout/', views.logout),
	path('v2/logout/', views.LogoutJWT.as_view(), name='logout_jwt'),
	path('v1/change-password/', views.change_password),
	path('v1/change-username/', views.change_username),
	path('v1/edit_user_profile/', views.edit_user_profile),
	path('v1/agree_privacy/', views.agree_privacy),
	path('v1/change-2fa/', views.change_2fa),
	path('v1/anonymize_data/', views.change_visibility),
	path('v1/delete_account/', views.delete_account),

	# Profile Management
	path('v1/profile/<str:username>/', views.profile),

	# friend request
	path('v1/friend_request/send/', views.send_friend_request, name='send_friend_request'),
    path('v1/friend_request/accept/', views.accept_friend_request, name='accept_friend_request'),
    path('v1/friend_request/decline/', views.decline_friend_request, name='decline_friend_request'),
    
	# game
    # path('v1/game/entry_online_game/', views.entry_online_game, name='entry_online_game'),
	path('v1/create_matchroom/', views.create_matchroom, name='create_matchroom'),
    path('v1/join_matchroom/', views.join_matchroom, name='join_matchroom'),
    
	#tournament
    path('v1/tournament/create/', views.create_tournament, name='create_tournament'),
    path('v1/tournament/submit_score/', views.submit_score, name='submit_score'),

    # Notification endpoints
    path('v1/notifications/', views.list_notifications, name='list_notifications'),
    path('v1/notifications/mark-as-read/', views.mark_notification_as_read, name='mark_notification_as_read'),
	path('v1/notifications/remove/', views.remove_notification, name='remove_notification'),

	# TOTP
	re_path(r'^totp/create/$', views.TOTPCreateView.as_view(), name='totp-create'),
    re_path(r'^totp/login/(?P<token>[0-9]{6})/$', views.TOTPVerifyView.as_view(), name='totp-login'),
]
