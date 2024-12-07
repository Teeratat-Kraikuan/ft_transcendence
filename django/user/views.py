from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.contrib.auth.models import User
from api.views import get_user_profile_data, get_user_match_history, get_user_match_summary, is_user_online

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
		return render(req, 'user.html', context)
	except User.DoesNotExist:
		return render(req, '404.html', {'message': 'User not found'}, status=404)
	except Exception as e:
		return render(req, '404.html', {'message': str(e)}, status=500)