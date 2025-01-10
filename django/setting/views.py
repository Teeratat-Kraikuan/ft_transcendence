from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# Create your views here.
@login_required
def settings(req):
	return render(req, 'settings.html')

@login_required
def twofactor_auth(req):
	enable2fa = req.user.profile.is_2fa_enabled
	is_student = req.user.profile.is_student
	return render(req, '2fa_auth.html', {'enable2fa': enable2fa, 'is_student': is_student})

@login_required
def twofactor_set_email(req):
	return render(req, '2fa_set_email.html')

@login_required
def twofactor_set_app(req):
	return render(req, '2fa_set_app.html')

@login_required
def email_confirm_otp(req):
	return render(req, 'email_confirm_otp.html')

@login_required
def audience_visibility(req):
	return render(req, 'audience_visibility.html')

@login_required
def manage_profile(req):
	return render(req, 'manage_profile.html')

@login_required
def manage_blocking(req):
	return render(req, 'manage_blocking.html')

@login_required
def change_username(req):
	return render(req, 'change_username.html')

@login_required
def change_password(req):
	return render(req, 'change_password.html')

@login_required
def delete_account(req):
	return render(req, 'delete_account.html')
