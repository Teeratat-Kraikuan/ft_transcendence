from django.shortcuts import render, redirect
from django.contrib.auth.models import User, auth
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from .models import CustomUser, FriendRequest, MatchHistory
from chatapp.models import Room
from django.db.models import Q
from dotenv import load_dotenv
import os
import requests

load_dotenv()

# Create your views here.
@login_required
def profile(request, username):
	context = {}
	if request.method == 'POST':
		if request.POST.get('submit') == 'edit':
			profile_image = request.FILES.get('profile_image')
			banner_image = request.FILES.get('banner_image')
			description = request.POST.get('description')

			user_profile = request.user
			if profile_image:
				user_profile.profile_image = profile_image
			if banner_image:
				user_profile.banner_image = banner_image
			if description:
				user_profile.description = description
			user_profile.save()
			return JsonResponse({'success': True, 'message': 'Profile updated successfully.'})
		else:
			return JsonResponse({'success': False, 'errors': 'Invalid submission.'}, status=400)

	try:
		profile = CustomUser.objects.get(username=username)
		context['profile'] = profile
		context['isFriend'] = True if profile.friends.filter(username=request.user).exists() else False
		context['isBlocked'] = True if request.user.blocked_user.filter(username=profile.username).exists() else False
		context['blockedUsers'] = profile.blocked_user.all()
		blockedUsers = [b for b in profile.blocked_user.all()]
		context['allFriend'] = profile.friends.exclude(username__in=blockedUsers)
		context['online'] = len(profile.friends.exclude(username__in=blockedUsers).filter(active__gt=0))
		context['offline'] = len(profile.friends.exclude(username__in=blockedUsers).filter(active=0))
		match_history = MatchHistory.objects.filter(
            Q(player1__username=profile.username) | Q(player2__username=profile.username)
        )

        # Serialize match history data if needed
		serialized_data = []
		for match in match_history:
			serialized_data.insert(0, {
                'game_type': match.game_type,
                'player1': match.player1.username if match.player1 else None,
                'player2': match.player2.username if match.player2 else None,
                'winner': match.winner.username if match.winner else None,
                'player1_score': match.player1_score,
                'player2_score': match.player2_score,
                'date_played': match.date_played.strftime('%Y-%m-%d')  # Format datetime as needed
            })
		goals_scored = sum([match.player1_score if match.player1 == profile else match.player2_score for match in match_history])
		goals_conceded = sum([match.player2_score if match.player1 == profile else match.player1_score for match in match_history])
		context['goals_scored'] = goals_scored
		context['goals_conceded'] = goals_conceded
		context['goals_diff'] = goals_scored - goals_conceded
		context['matchHistories'] = serialized_data
		context['wins'] = match_history.filter(winner=profile).count()
		context['losses'] = match_history.exclude(winner=profile).count()
		context['played'] = context['wins'] + context['losses']		
		context['winrate'] = round(((context['wins'] / (context['played'] if context['played'] != 0 else 1)) * 100), 2)
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
	context['online'] = len(request.user.friends.filter(active__gt=0))
	context['offline'] = len(request.user.friends.filter(active=0))
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
            'redirect_uri': 'http://42pong.com:8000/users/callback'
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