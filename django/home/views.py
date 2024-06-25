from django.shortcuts import render, redirect
from django.contrib.auth.models import auth
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.http import JsonResponse
from users.models import CustomUser, FriendRequest
from .models import *
from dotenv import load_dotenv
import os
import re

load_dotenv()

authorize_uri = os.getenv('AUTHORIZE_URI')

# Create your views here.
def home(request):
	context = {}
	if request.user.is_authenticated:
		context['allusers'] = CustomUser.objects.all()
		context['all_friend_requests'] = FriendRequest.objects.filter(to_user=request.user)
	return render(request, 'home.html', context)

def about(request):
	return render(request, "about.html")

def login(request):
	if request.user.is_authenticated:
		return redirect('home')
	context = {
		'authorize_uri' : authorize_uri
	}
	if request.method == 'POST':
		if request.POST.get('submit') == 'sign-in':
			username = request.POST['username']
			password = request.POST['password']

			user = auth.authenticate(username=username, password=password, is_student=False)

			if user is not None:
				auth.login(request, user)
				html_content = render_to_string('home.html', {'user': user})
				return JsonResponse({'success': True, 'html_content': html_content}, status=200)
			else:
				messages.error(request, 'Invalid login details', extra_tags='sign-in')
				return JsonResponse({'success': False, 'error': 'Invalid login details'}, status=200)
		elif request.POST.get('submit') == 'sign-up':
			username = request.POST['username']
			email = request.POST['email']
			password = request.POST['password']
			repeat_password = request.POST['repeat_password']

			if password == repeat_password:
				if CustomUser.objects.filter(email=email).exists():
					messages.error(request, 'Email Taken', extra_tags='sign-up')
					return JsonResponse({'success': False, 'error': 'Email Taken'}, status=200)
				elif CustomUser.objects.filter(username=username).exists():
					messages.error(request, 'Username Taken', extra_tags='sign-up')
					return JsonResponse({'success': False, 'error': 'Username Taken'}, status=200)
				elif not validPass(password):
					messages.error(request, "Password must have at least 8 charters, 1 uppercase, 1 lowercase and 1 digit", extra_tags="sign-up")
					return JsonResponse({'success': False, 'error': 'Password must have at least 8 charters, 1 uppercase, 1 lowercase and 1 digit'}, status=200)
				elif not validEmail(email):
					messages.error(request, "Invalid Email", extra_tags='sign-up')
					return JsonResponse({'success': False, 'error': 'Invalid Email'}, status=200)
				else:
					user = CustomUser.objects.create(username=username, email=email, password=password)
					user.set_password(password)
					user.save()
					messages.success(request, 'Your signup successful', extra_tags='sign-up')
					return JsonResponse({'success': True, 'success': 'Your signup successful'}, status=200)
			else:
				messages.error(request, 'Password Not Matching', extra_tags='sign-up')
				return JsonResponse({'success': False, 'error': 'Password Not Matching'}, status=200)
	return render(request, "login.html", context)

def validEmail(email):
	regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'
	return True if re.fullmatch(regex, email) else False

def validPass(password):
	lower = [c for c in password if c.islower()]
	upper = [c for c in password if c.isupper()]
	digit = [c for c in password if c.isdigit()]
	if len(password) < 8:
		return False
	elif len(lower) == 0:
		return False
	elif len(upper) == 0:
		return False
	elif len(digit) == 0:
		return False
	return True

@login_required
def logout(request):
	auth.logout(request)
	return redirect('home')

def setting(request):
    return render(request, 'setting.html')

def handler404(request, exception):
    return render(request, '404.html', status=404)

