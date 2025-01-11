from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.template import loader
from django.contrib.auth.models import User
from user.models import FriendRequest
from django.contrib.staticfiles import finders
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import random

# Create your views here.
# @login_required()
def home(req):
	if req.user.is_authenticated:
		terms_content = ""
		file_path = finders.find('terms_of_service.txt')
		if file_path:
			with open(file_path, 'r') as file:
				terms_content = file.read()
		else:
			terms_content = "The Terms of Service could not be loaded."
		return render(req, 'home.html', {'terms_content': terms_content})
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
	users = User.objects.select_related('profile').exclude(id=req.user.id).exclude(profile__is_anonymous=True)

	friends = req.user.profile.friends.all().values_list('user__username', flat=True)

	print(list(friends))

	user_data = [
		{
			'username': user.username,
			'is_admin': user.is_staff or user.is_superuser,
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
