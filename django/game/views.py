import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated

# Create your views here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match(req, mode):
	return render(req, 'match.html', {'mode' : mode})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def remote_match(req, match_id):
	return render(req, 'remote_match.html',{
		'match_id': match_id,
		'username': req.user.username,
		'avatar': req.user.profile.avatar.url,
	})

def waiting(req):
	return render(req, 'waiting_room.html')

def tournament_room(req):
	return render(req, 'tournament_room.html')
