import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# Create your views here.
@login_required
def match(req, mode):
	return render(req, 'match.html', {'mode' : mode})

@login_required
def remote_match(req, match_id):
	data_obj = {
        'match_id': match_id,
        'username': req.user.username,
    }

	data_json = json.dumps(data_obj)

	return render(req, 'remote_match.html', {'data_json': data_json})

def waiting(req):
	return render(req, 'waiting_room.html')

def tournament_room(req):
	return render(req, 'tournament_room.html')
