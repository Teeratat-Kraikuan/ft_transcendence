from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import PongGame
import random

# Create your views here.
def game(request):
	return render(request, "game.html")

def pong(request):
	username = request.user.username if request.user.is_authenticated else 'guest'
	context = {'username':username}
	if request.method == "POST":
		if request.POST.get('mode') == 'singleplayer':
			# print('singleplayer', request.POST.get('difficulty'))
			if request.POST.get('difficulty') == 'easy':
				pass
			elif request.POST.get('difficulty') == 'medium':
				pass
			elif request.POST.get('difficulty') == 'hard':
				pass
		elif request.POST.get('mode') == 'multiplayer':
			# print('multiplayer', request.POST.get('type'))
			if request.POST.get('type') == 'create':
				created = False
				while not created:
					room_code = str(random.randint(111111,999999))
					pong_room, created = PongGame.objects.get_or_create(room_code=room_code, player1=username)
				context['room_code'] = room_code
				return render(request, "pong.html", context)
			elif request.POST.get('type') == 'join':
				room_code = request.POST.get('room_code')
				try:
					pong_room = PongGame.objects.get(room_code=room_code)
					if pong_room.player2 != "to-be-decide":
						messages.error(request, "that room is full")
						return redirect('game')
					pong_room.player2 = username
					pong_room.save()
					context['room_code'] = room_code
					return render(request, "pong.html", context)
				except:
					messages.error(request, "no room with this code")
					return redirect('game')
	return render(request, "pong.html", context)

@login_required
def tournament(request):
	if not request.user.is_authenticated:
		return redirect('login')
	return render(request, 'tournament.html')

@login_required
def tournament_waiting(request): # Waiting room
	if not request.user.is_authenticated:
		return redirect('login')
	if request.method != 'POST':
		return render(request, 'tournament.html')
	context = {}
	context['num_players'] = request.POST.get('num_players')
	context['username'] = request.POST.get('aka') or request.user.username
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

def queue(request):
	pass

def round_robin_concurrent(num_players):
  pairings = []
  for i in range(num_players):
    partner = (i + num_players // 2) % num_players
    pairings.append([i, partner])

  return pairings