from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.contrib.auth.models import User
from api.views import get_user_profile_data, get_user_match_history, get_user_match_summary, is_user_online
from django.middleware.csrf import get_token
from requests_oauthlib import OAuth2Session
import os

# Create your views here.

def login(req):
	if req.user.is_authenticated:
		return redirect('home')
	print(req.GET.get(settings.REDIRECT_FIELD_NAME))
	return render(req, 'login.html', {
		"redirect": req.GET.get(settings.REDIRECT_FIELD_NAME)
			if req.GET.get(settings.REDIRECT_FIELD_NAME) else '/home/'
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
		profile_data = get_user_profile_data(username)
		friends = profile_data.get('friends', [])  # Assuming 'friends' contains usernames
		is_friend = req.user.username in friends

		online_friends = []
		offline_friends = []

		for friend_username in friends:
			friend_user = User.objects.get(username=friend_username)
			if is_user_online(friend_user):
				online_friends.append(friend_user)
			else:
				offline_friends.append(friend_user)

		profile_data['online_friends'] = online_friends
		profile_data['offline_friends'] = offline_friends
		del profile_data['friends']

		match_history_data = get_user_match_history(username)
		match_summary_data = get_user_match_summary(username)

		# Merge all data into a single context dictionary
		context = {**profile_data, **match_history_data, **match_summary_data}
		context['is_friend'] = is_friend
		return render(req, 'user.html', context)
	except User.DoesNotExist:
		return render(req, '404.html', {'message': 'User not found'}, status=404)
	except Exception as e:
		return render(req, '404.html', {'message': str(e)}, status=500)

def oauth(req):
	client_id = os.environ["CLIENT_ID"]
	client_secret = os.environ["CLIENT_SECRET"]
	redirect_uri = "https://localhost:8443/oauth"
	code = req.GET.get("code")
	state = req.GET.get("state")
	csrf_token = get_token(req)
	oauth = OAuth2Session(
		client_id,
		redirect_uri=redirect_uri
	)
	if not code:
		authorization_url, state = oauth.authorization_url(
			'https://api.intra.42.fr/oauth/authorize',
			kwargs = {
				'csrfToken': csrf_token
			}
		)
		return redirect(authorization_url)
	elif state:
		token = oauth.fetch_token(
			'https://api.intra.42.fr/oauth/token',
			client_secret=client_secret,
			code=code,
			kwargs = {
				'csrfToken': csrf_token
			}
		)
		user_data = oauth.get('https://api.intra.42.fr/v2/me').json()
		login = user_data.get('login')
		email = user_data.get('email')
		return redirect("/")
	return redirect("/login")
