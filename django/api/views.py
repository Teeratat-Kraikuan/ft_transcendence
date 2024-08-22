from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from user.models import Profile
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout

# Create your views here.

def login(req):
	if req.method == 'POST':
		email = req.POST.get('email')
		password = req.POST.get('password')

		if not email or not password:
			return JsonResponse({'message': 'Email and password are required.'}, status=400)

		user = authenticate(req, username=email, password=password)

		if user is not None:
			auth_login(req, user)
			return JsonResponse({'message': 'Login successful'}, status=200)
		else:
			return JsonResponse({'message': 'Invalid email or password.'}, status=401)
	return JsonResponse({'message': 'Invalid request method'}, status=405)

def logout(req):
	if req.user.is_authenticated:
		auth_logout(req)
		return JsonResponse({'message': 'Logout successful'}, status=200)
	return JsonResponse({'message': 'Logout unsuccess'}, status=400)

def register(req):
	if req.method == 'POST':
		username = req.POST['username']
		email = req.POST['email']
		password = req.POST['password']
		repeat_password = req.POST['repeat_password']

		if not username or not email or not password or not repeat_password:
			return JsonResponse({'message': 'All fields are required.'}, status=400)

		if password != repeat_password:
			return JsonResponse({'message': 'Passwords do not match.'}, status=400)

		if User.objects.filter(email=email).exists():
			return JsonResponse({'message': 'Email already registered.'}, status=400)

		user = User(username=username, email=email)
		user.set_password(password)
		user.save()

		Profile.objects.create(user=user)

		return JsonResponse({'message': 'Register successful'}, status=200)
	return JsonResponse({'message': 'Invalid request method'}, status=405)

@login_required
def profile(req):
	return JsonResponse({'message': 'Invalid request method'}, status=405)
