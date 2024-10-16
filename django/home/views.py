from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.template import loader

import random

# Create your views here.
# @login_required()
def home(req):
	return render(req, 'home.html')

@login_required
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
	return render(req, 'community.html')
