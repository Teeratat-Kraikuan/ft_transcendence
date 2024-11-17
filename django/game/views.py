from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def match(req):
	return render(req, 'match.html')

def waiting(req):
	return render(req, 'waiting_room.html')

def tournament_room(req):
	return render(req, 'tournament_room.html')
