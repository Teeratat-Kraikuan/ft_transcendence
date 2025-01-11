from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.conf import settings
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Model
from user.models import Profile, FriendRequest
from api.views import get_user_profile_data, get_user_match_history, get_user_match_summary, is_user_online, is_user_anonymous
from django.middleware.csrf import get_token
from requests_oauthlib import OAuth2Session
import requests
import mimetypes
import hashlib
import os

# Create your views here.

def login(req):
	next_url = req.GET.get("next", "/home")
	if req.user.is_authenticated:
		return redirect(next_url)
	return render(req, 'login.html', {
		"redirect": next_url
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
		if (username != req.user.username):
			if profile_data['is_anonymous']:
				return render(req, '404.html', {'message': 'User not found'}, status=404)
		all_friends = profile_data.get('friends', [])
		friends = []
		for friend_username in all_friends:
			friend_user = User.objects.get(username=friend_username)
			if not is_user_anonymous(friend_username):
				friends.append(friend_username)
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

def oauth_login(req, user_data):
	email = user_data.get('email')
	password = hashlib.sha256(str(os.environ['CLIENT_SECRET']).encode('utf-8')).hexdigest()
	user = authenticate(req, username=email, password=password)
	if user is not None:
		auth_login(req, user)
		next_page = req.session.get('_next', '/home')
		if req.session.get('_next', False):
			del req.session['_next']
		login = redirect(next_page)
		login.set_cookie('loggedin', 'true', samesite='Lax', max_age=req.session.get_expiry_age())
		return login
		# return JsonResponse({'message': 'Login successful'}, status=200)
	return redirect("/login")
	# return JsonResponse({'message': 'Invalid email or password.'}, status=401)

def download_image(url:str, name:str):
	response = requests.get(url, stream=True)
	response.raise_for_status()
	content_type = response.headers['content-type']
	extension = mimetypes.guess_extension(content_type)
	file_name = f"{name}{extension}"
	return ContentFile(response.content, name=file_name)

def setup_profile(req, data):
	profile, created = Profile.objects.get_or_create(user=data['user'])
	if not created:
		if data['pfp']:
			profile.avatar = download_image(data['pfp'], f"{data['user'].username}_avatar")
		if data['banner']:
			profile.banner = download_image(data['banner'], f"{data['user'].username}_banner")
		profile.save()

def oauth_register(req, oauth, user_data):
	username = user_data.get('login')
	user_id = user_data.get('id')
	email = user_data.get('email')
	profile_picture = user_data.get('image').get('link') or None
	coalition = oauth.get(f"https://api.intra.42.fr/v2/users/{user_id}/coalitions").json()
	coalitions_banner = coalition[-1].get("cover_url") or None
	if not username or not email:
			return JsonResponse({'message': 'All fields are required.'}, status=400)

	if User.objects.filter(username=username).exists():
		return JsonResponse({'message': 'Username already taken.'}, status=400)

	if User.objects.filter(email=email).exists():
		return JsonResponse({'message': 'Email already registered.'}, status=400)

	password = hashlib.sha256(str(os.environ['CLIENT_SECRET']).encode('utf-8')).hexdigest()
	user = User(username=username, email=email)
	user.set_password(password)
	user.save()
	setup_profile(req, {
		"user": user,
		"pfp": profile_picture,
		"banner": coalitions_banner
	})
	return oauth_login(req, user_data)
	# return JsonResponse({'message': 'Register successful'}, status=200)

def oauth_42(req):
	if req.user.is_authenticated:
		return JsonResponse({'message': 'User is already authenticated'})
	# try:
	client_id = os.environ["CLIENT_ID"]
	client_secret = os.environ["CLIENT_SECRET"]
	redirect_uri = "https://localhost:8443/oauth_42"
	code = req.GET.get("code")
	state = req.GET.get("state")
	csrf_token = get_token(req)
	oauth = OAuth2Session(
		client_id,
		redirect_uri=redirect_uri
	)
	if not code:
		req.session['_next'] = req.GET.get("next", "/home")
		authorization_url, state = oauth.authorization_url(
			'https://api.intra.42.fr/oauth/authorize',
			kwargs = {
				'csrfToken': csrf_token
			}
		)
		return redirect(authorization_url)
		# return JsonResponse({'redirect_uri': authorization_url})
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
		if User.objects.filter(email=user_data.get('email')).exists():
			return oauth_login(req, user_data)
		else:
			return oauth_register(req, oauth, user_data)
	# except Exception as error:
	# 	return redirect("/")
		# return JsonResponse({'message': type(error).__name__})
	return redirect("/")
	# return JsonResponse({'message': 'Oauth fatal error'})
