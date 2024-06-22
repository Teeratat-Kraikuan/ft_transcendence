from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from .models import PongGame, Tournament, TournamentParticipant, MatchTournament
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

### ***** TOURNAMENT ***** ###

@login_required
def tournament(request):
	if not request.user.is_authenticated:
		return redirect('login')
	return render(request, 'tournament.html')

@login_required
def tournament_waiting(request): # waiting room
	if request.method != 'POST':
		return render(request, 'tournament.html')
	
	nickname = request.POST.get('aka') or request.user.username
	user = request.user
	num_players = 4

	# Check if the player is in a tournament with status 'started'
	started_tournament_participant = TournamentParticipant.objects.filter(user=user, tournament__status='started').first()
	if started_tournament_participant:
		started_tournament = started_tournament_participant.tournament
		participants = started_tournament.tournamentparticipant_set.all()
		context = {
            'num_players': 4,
            'range_num_players': range(4),
            'nickname': started_tournament_participant.nickname,
            'tournament': started_tournament,
            'participants': participants,
        }
		return render(request, 'tournament_waiting.html', context)
    
    # Find an open tournament with less than 4 participants
	open_tournament = None
	for tournament in Tournament.objects.filter(status='open'):
		if tournament.tournamentparticipant_set.count() < num_players:
			# Check if nickname is already used in this tournament
			if not TournamentParticipant.objects.filter(tournament=tournament, nickname=nickname).exists():
				open_tournament = tournament
				break

	if not open_tournament:
		# Create a new tournament if no open tournament is available
		open_tournament = Tournament.objects.create(name=f"Tournament_{Tournament.objects.count() + 1}")
    
    # Add user to the tournament
	TournamentParticipant.objects.create(tournament=open_tournament, user=user, nickname=nickname)

	# Check if the tournament is now full
	if open_tournament.tournamentparticipant_set.count() == num_players:
		open_tournament.status = 'started'
		open_tournament.save()
		generate_round_robin_matches(open_tournament)
		
	participants = open_tournament.tournamentparticipant_set.all()
	
	context = {
        'num_players': num_players,
        'range_num_players': range(num_players),
        'nickname': nickname,
        'tournament': open_tournament,
		'participants': participants,
    }
	return render(request, 'tournament_waiting.html', context)

def generate_round_robin_matches(tournament):
	participants = list(tournament.tournamentparticipant_set.all())
	num_participants = len(participants)
	
	matches = []
	for i in range(num_participants):
		for j in range(i + 1, num_participants):
			matches.append(MatchTournament(
                tournament=tournament,
                player1=participants[i].user,
                player2=participants[j].user
            ))

    # Bulk create matches for efficiency
	MatchTournament.objects.bulk_create(matches)

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
