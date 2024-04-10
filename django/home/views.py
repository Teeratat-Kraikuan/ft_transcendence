from django.shortcuts import render, redirect
from django.contrib.auth.models import auth
from django.contrib import messages
from users.models import CustomUser, FriendRequest
from .models import *

authorize_uri = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-6d5edcad7b55ae9cff9a4cdc5d1b9e70c11fcbf7fa394e2c403c1d86f60d6625&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fusers%2Fcallback&response_type=code"

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
				return redirect('home')
			else:
				messages.error(request, 'Invalid login details', extra_tags='sign-in')
				return redirect('login')
		elif request.POST.get('submit') == 'sign-up':
			username = request.POST['username']
			email = request.POST['email']
			password = request.POST['password']
			repeat_password = request.POST['repeat_password']

			if password == repeat_password:
				if CustomUser.objects.filter(email=email).exists():
					messages.error(request, 'Email Taken', extra_tags='sign-up')
					return redirect('login')
				elif CustomUser.objects.filter(username=username).exists():
					messages.error(request, 'Username Taken', extra_tags='sign-up')
					return redirect('login')
				else:
					user = CustomUser.objects.create(username=username, email=email, password=password)
					user.set_password(password)
					user.save()
			else:
				messages.error(request, 'Password Not Matching', extra_tags='sign-up')
				return redirect('login')
	return render(request, "login.html", context)

def logout(request):
	auth.logout(request)
	return redirect('home')