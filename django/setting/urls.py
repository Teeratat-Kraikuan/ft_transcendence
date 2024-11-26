from django.urls import path
from . import views

urlpatterns = [
	path('', views.settings, name='settings'),
	path('2fa_auth/', views.twofactor_auth, name='twofactor_auth'),
	path('2fa_auth/2fa_set_email/', views.twofactor_set_email, name='2fa_set_email'),
	path('2fa_auth/2fa_set_app/', views.twofactor_set_app, name='2fa_set_app'),
	path('2fa_auth/email_confirm_otp/', views.email_confirm_otp, name='email_confirm_otp'),
	path('audience_visibility/', views.audience_visibility, name='audience_visibility'),
	path('audience_visibility/manage_profile/', views.manage_profile, name='manage_profile'),
	path('audience_visibility/manage_blocking/', views.manage_blocking, name='manage_blocking'),
	path('change_username/', views.change_username, name='change_username'),
	path('change_password/', views.change_password, name='change_password'),
	path('delete_account/', views.delete_account, name='delete_account')
]
