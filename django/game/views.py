import json
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import permission_classes, api_view
from rest_framework.permissions import IsAuthenticated
from game.models import MatchRoom, MatchHistory, Tournament, Player, Match
from django.db.models import Q

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

def tournament_match(req, match_id):
	match = Match.objects.get(id=match_id)
	player1 = match.player1
	player2 = match.player2

	return render(req, 'match.html', {
		'player1': player1.name,
		'player2': player2.name,
		'mode': 'tournament',
	})

def tournament_room(req, tournament_id):
	tournament = Tournament.objects.get(id=tournament_id)
	
	round_number = tournament.last_round
	round_number += 1

	players = Player.objects.filter(tournament=tournament)
	matches = Match.objects.filter(tournament=tournament)

	next_match = matches.filter(round_number=round_number).first()

	scoreboard = []
	for player in players:
		played_matches = matches.filter(
			(Q(player1=player) | Q(player2=player)) & Q(played=True)
		)
		wins = played_matches.filter(winner=player).count()
		losses = played_matches.count() - wins
		goals_for = sum(
			match.player1_score if match.player1 == player else match.player2_score
			for match in played_matches
		)
		goals_against = sum(
			match.player2_score if match.player1 == player else match.player1_score
			for match in played_matches
		)
		goal_difference = goals_for - goals_against
		points = (wins * 3)

		scoreboard.append({
			'name': player.name,
			'played': played_matches.count(),
			'wins': wins,
			'losses': losses,
			'goal_difference': goal_difference,
			'points': points,
		})

	scoreboard.sort(key=lambda x: (x['points'], x['goal_difference'], x['wins']), reverse=True)
	
	return render(req, 'tournament_room.html', {
		'tournament_id': tournament_id,
		'players': players,
		'next_match' : next_match,
		'round_number': round_number,
		'scoreboard': scoreboard,
	})
