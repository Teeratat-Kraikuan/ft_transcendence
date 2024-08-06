from django.shortcuts import render
from django.template import loader

import random

# Create your views here.
def login(req):
	return render(req, 'login.html')

def login_2fa(req):
	return render(req, 'login_2fa.html')

def signup(req):
	return render(req, 'signup.html')

def home(req):
	return render(req, 'home.html')

def offline(req):
	return render(req, 'offline.html')

def online(req):
	return render(req, 'online.html')

def tournament(req):
	return render(req, 'tournament.html')

def tournament_queue(req):
	return render(req, 'tournament_queue.html')
