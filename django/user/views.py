from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.contrib.auth.models import User
from api.views import get_user_profile_data

# Create your views here.

def login(req):
	if req.user.is_authenticated:
		return redirect('home')
	return render(req, 'login.html', {
		"redirect": req.GET.get(settings.REDIRECT_FIELD_NAME)
			if req.GET.get(settings.REDIRECT_FIELD_NAME) else '/home'
	})

def login_2fa(req):
	if req.user.is_authenticated:
		return redirect('home')
	return render(req, 'login_2fa.html')

def signup(req):
	if req.user.is_authenticated:
		return redirect('home')
	return render(req, 'signup.html')

def logout(req):
	if not req.user.is_authenticated:
		return redirect('home')
	return render(req, 'logout.html')

@login_required
def user(req, username):
    try:
        # Reuse the utility function to fetch the profile data
        context = get_user_profile_data(username)
        return render(req, 'user.html', context)
    except User.DoesNotExist:
        return render(req, 'error.html', {'message': 'User not found'}, status=404)
    except Exception as e:
        return render(req, 'error.html', {'message': str(e)}, status=500)
