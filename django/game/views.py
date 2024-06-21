from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from .models import PongGame
from users.models import CustomUser, MatchHistory
import random
import json

# Create your views here.
def game(request):
	return render(request, "game.html")

def pong(request):
	context = {}
	username = request.user.username if request.user.is_authenticated else 'guest'
	context['default_image'] = '/media/profile_pics/default_profile_image.png'
	context['username'] = username
	context['profile_image'] = request.user.profile_image.url if request.user.is_authenticated else '/media/profile_pics/default_profile_image.png'
	if request.method == "POST":
		if request.POST.get('type') == 'create':
			created = False
			while not created:
				room_code = str(random.randint(111111,999999))
				pong_room, created = PongGame.objects.get_or_create(room_code=room_code, player1=username)
			context['playerNo'] = 1
			context['room_code'] = room_code
			context['game_state'] = 'None'
			print(context['game_state'])
			return render(request, "pong.html", context)
		elif request.POST.get('type') == 'join':
			room_code = request.POST.get('room_code')
			try:
				pong_room = PongGame.objects.get(room_code=room_code)
				context['room_code'] = room_code
				context['game_state'] = 'None'
				if pong_room.player2 != "to-be-decide":
					context['game_state'] = pong_room.get_game_state()
					if pong_room.player1 == request.user.username or pong_room.player2 == request.user.username:
						context['playerNo'] = 1 if pong_room.player1 == request.user.username else 2
						context['isJoin'] = True
						return render(request, "pong.html", context)
					messages.error(request, "that room is full")
					return redirect('game')
				pong_room.player2 = username
				pong_room.save()
				context['playerNo'] = 2
				return render(request, "pong.html", context)
			except:
				messages.error(request, "cannot access this room")
				return redirect('game')
	return render(request, "pong.html", context)

def pong_ai(request):
	context = {}
	return render(request, 'pong-ai.html', context)

def pong_local(request):
	context = {}
	return render(request, 'pong-local.html', context)

@login_required
def tournament(request):
	if not request.user.is_authenticated:
		return redirect('login')
	return render(request, 'tournament.html')

@login_required
def tournament_waiting(request): # Waiting room
	# if not request.user.is_authenticated:
	# 	return redirect('login')
	# if request.method != 'POST':
	# 	return render(request, 'tournament.html')
	context = {}
	# num_players = int(request.POST.get('num_players'))
	num_players = 4
	context['num_players'] = num_players
	context['range_num_players'] = range(num_players)
	# context['username'] = request.POST.get('aka') or request.user.username
	context['username'] = "Dummy"
	return render(request, 'tournament_waiting.html', context) 
	# return render(request, 'tournament_waiting.html', context) # original

@login_required
def tournament_pong(request): # Pong Game
	if not request.user.is_authenticated:
		return redirect('login')
	return render(request, 'tournament_pong.html')

@login_required
def tournament_game(request): # Waiting in game
	if not request.user.is_authenticated:
		return redirect('login')
	return render(request, 'tournament_pong.html')

def round_robin_concurrent(num_players):
  pairings = []
  for i in range(num_players):
    partner = (i + num_players // 2) % num_players
    pairings.append([i, partner])

  return pairings

def match_record(request):
	if request.method == "POST":
		print("post method")
		try:
			game_type = request.POST.get('gameType')
			player1_name = request.POST.get('player1name')
			player2_name = request.POST.get('player2name')
			winner = request.POST.get('winner')
			player1_score = int(request.POST.get('player1score'))
			player2_score = int(request.POST.get('player2score'))
			
			if player1_name != 'guest':
				player1 = CustomUser.objects.get(username=player1_name)
			else:
				player1 = None
            
			if player2_name != 'guest':
				player2 = CustomUser.objects.get(username=player2_name)
			else:
				player2 = None
				
			if winner != 'guest':
				winner = CustomUser.objects.get(username=winner)
			else:
				winner = None
			
			match = MatchHistory.objects.create(
                game_type=game_type,
                player1=player1,
                player2=player2,
                winner=winner,
                player1_score=player1_score,
                player2_score=player2_score
            )
			return JsonResponse({'message': 'Match recorded successfully'})
		except Exception as e:
			return JsonResponse({'error': str(e)}, status=400)
	return JsonResponse({'error': 'Invalid request method'}, status=400)
