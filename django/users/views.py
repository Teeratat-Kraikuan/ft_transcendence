from django.shortcuts import render, redirect
from django.contrib.auth.models import User, auth
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest
from .models import CustomUser, FriendRequest
from chatapp.models import Room
from dotenv import load_dotenv
import os
import requests

load_dotenv()

# Create your views here.
@login_required
def profile(request, username):
	context = {}
	try:
		profile = CustomUser.objects.get(username=username)
		context['online'] = len(profile.friends.filter(active=True))
		context['offline'] = len(profile.friends.filter(active=False))
		context['profile'] = profile
		context['isFriend'] = True if profile.friends.filter(username=request.user).exists() else False
		context['allFriend'] = profile.friends.all
	except:
		messages.error(request, 'user not found')
		return redirect('home')
	return render(request, 'profile.html', context)

@login_required
def friend(request):
	context = {}
	all_friend_requests = FriendRequest.objects.filter(to_user=request.user)
	from_user_ids = all_friend_requests.values_list('from_user_id', flat=True)
	allusers = CustomUser.objects.all().exclude(id__in=from_user_ids)
	context['online'] = len(request.user.friends.filter(active=True))
	context['offline'] = len(request.user.friends.filter(active=False))
	context['all_friend_requests'] = all_friend_requests
	context['allusers'] = allusers
	return render(request, 'friend.html', context)

@login_required
def send_friend_request(request, userID):
	try:
		from_user = request.user
		to_user = CustomUser.objects.get(id=userID)
	except:
		messages.error(request, 'userId not found')
		return redirect('home')
	friend_request, created = FriendRequest.objects.get_or_create(from_user=from_user, to_user=to_user)
	if created:
		messages.success(request, 'friend request sent')
		return redirect('home')
	else:
		messages.error(request, 'friend request was already sent')
		return redirect('home')
	
@login_required
def accept_friend_request(request, requestID):
	friend_request = FriendRequest.objects.get(id=requestID)
	if friend_request.to_user == request.user:
		friend_request.to_user.add_friend(friend_request.from_user)
		friend_request.from_user.add_friend(friend_request.to_user)
		Room.create_room(friend_request.from_user, friend_request.to_user)
		friend_request.delete()
	return redirect('friend')
	
def callback(request):
	authroization_code = request.GET.get('code')
	if authroization_code is None:
		return HttpResponseBadRequest("Bad Request: Missing 'code' parameter")
	
	o42 = Oauth42()
	token = o42.get_token(authroization_code)
	print(token)
	if token == None:
		messages.warning(request, "Couldn't exchange code for access token.")
		return redirect('login')
	
	user_data = o42.get_user_data(token)
	if user_data == None:
		messages.warning(request, "Error: unable to login")
		return redirect('login')
	username_42 = user_data.get('login')
	email_42 = user_data.get('email')

	if username_42 in str(CustomUser.objects.all()):
		known_user = CustomUser.objects.get(username=username_42)
		if known_user.is_student == True:
			auth.login(request, known_user)
			known_user.active = True
			known_user.save()
		else:
			messages.warning(request, "This username was created without 42intra.")
	else:
		newUser = CustomUser.objects.create(username=username_42, email=email_42)
		newUser.is_student = True
		newUser.active = True
		newUser.save()
		auth.login(request, newUser)

	return redirect('home')

class Oauth42:
	def get_token(self, code):
		url = 'https://api.intra.42.fr/oauth/token'
		data = {
            'grant_type': 'authorization_code',
            'client_id': os.getenv('CLIENT_ID'),
            'client_secret': os.getenv('CLIENT_SECRET'),
            'code': code,
            'redirect_uri': 'http://localhost:8000/users/callback'
        }
		response = requests.post(url, data=data)
		if response.status_code == 200:
			token_data = response.json()
			return token_data.get('access_token')
		else:
			return None

	def get_user_data(self, access_token):
		headers = {'Authorization' : f'Bearer {access_token}'}
		response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)

		if response.status_code == 200:
			user_data = response.json()
			return user_data
		else:
			return None