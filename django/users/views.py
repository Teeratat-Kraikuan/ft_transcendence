from django.shortcuts import render, redirect
from django.contrib.auth.models import User, auth
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
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
		context['profile'] = profile
		context['isFriend'] = True if profile.friends.filter(username=request.user).exists() else False
		context['isBlocked'] = True if request.user.blocked_user.filter(username=profile.username).exists() else False
		context['blockedUsers'] = profile.blocked_user.all()
		blockedUsers = [b for b in profile.blocked_user.all()]
		context['allFriend'] = profile.friends.exclude(username__in=blockedUsers)
		context['online'] = len(profile.friends.exclude(username__in=blockedUsers).filter(active=True))
		context['offline'] = len(profile.friends.exclude(username__in=blockedUsers).filter(active=False))
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
	blockedUsers = [b for b in request.user.blocked_user.all()]
	context['allFriend'] = request.user.friends.exclude(username__in=blockedUsers)
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

@login_required
def block(request, username):
	blockUser = CustomUser.objects.get(username=username)
	request.user.blocked_user.add(blockUser)
	return redirect('chat')

@login_required
def unblock(request, username):
	print("unblocking")
	try:
		unblock_user = CustomUser.objects.get(username=username)
		if not request.user.blocked_user.filter(pk=unblock_user.pk).exists():
			return JsonResponse({'status': 'fail', 'message': 'User is not blocked'}, status=400)
		request.user.blocked_user.remove(unblock_user)
		return JsonResponse({'status': 'success', 'message': 'User unblocked'})
	except CustomUser.DoesNotExist:
		return JsonResponse({'status': 'fail', 'message': 'User does not exist'}, status=404)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
	
def callback(request):
	authroization_code = request.GET.get('code')
	if authroization_code is None:
		return HttpResponseBadRequest("Bad Request: Missing 'code' parameter")
	
	o42 = Oauth42()
	token = o42.get_token(authroization_code)
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
		else:
			messages.warning(request, "This username was created without 42intra.")
	else:
		newUser = CustomUser.objects.create(username=username_42, email=email_42)
		newUser.is_student = True
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