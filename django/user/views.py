from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.middleware.csrf import get_token
from requests_oauthlib import OAuth2Session
import os

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

def user(req, user_id):
	return render(req, 'user.html', {
		"user_id": user_id
	})

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
