from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# Create your views here.
# @login_required
def settings(req):
	return render(req, 'settings.html')

def twofactor_auth(req):
	return render(req, '2fa_auth.html')

def twofactor_set_email(req):
	return render(req, '2fa_set_email.html')

def twofactor_set_app(req):
	return render(req, '2fa_set_app.html')

def email_confirm_otp(req):
	return render(req, 'email_confirm_otp.html')

def audience_visibility(req):
	return render(req, 'audience_visibility.html')

def manage_profile(req):
	return render(req, 'manage_profile.html')

def manage_blocking(req):
	return render(req, 'manage_blocking.html')

def change_username(req):
	return render(req, 'change_username.html')

def change_password(req):
	return render(req, 'change_password.html')

def delete_account(req):
	return render(req, 'delete_account.html')
