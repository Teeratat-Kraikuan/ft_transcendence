from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

# Create your views here.

def login(req):
	if req.user.is_authenticated:
		return redirect('home')
	return render(req, 'login.html')

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

def user(req, user_id):
	return render(req, 'user.html', {
		"user_id": user_id
	})
