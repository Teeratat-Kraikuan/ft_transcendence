from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.template import loader
from django.contrib.auth.models import User
from user.models import FriendRequest

import random

# Create your views here.
# @login_required()
def home(req):
	return render(req, 'home.html')

def offline(req):
	return render(req, 'offline.html')

@login_required
def online(req):
	return render(req, 'online.html')

@login_required
def tournament(req):
	return render(req, 'tournament.html')

@login_required
def tournament_queue(req):
	return render(req, 'tournament_queue.html')

@login_required
def community(req):
	users = User.objects.select_related('profile').exclude(id=req.user.id)

	friends = req.user.profile.friends.all().values_list('user__username', flat=True)

	print(list(friends))

	user_data = [
		{
			'username': user.username,
			'description': user.profile.description,
			'avatar_url': user.profile.avatar.url if user.profile.avatar else None,
			'banner_url': user.profile.banner.url if user.profile.banner else None,
		}
		for user in users
	]

	context = {
		'users': user_data,
		'friends': list(friends),
	}
	return render(req, 'community.html', context)
