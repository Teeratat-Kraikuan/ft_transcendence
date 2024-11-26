from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from user.models import Profile
from game.models import MatchHistory
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.db.models import Q, Sum, Count
from django.utils.timezone import now
from datetime import timedelta

# Create your views here.

def login(req):
	if req.method == 'POST':
		email = req.POST.get('email')
		password = req.POST.get('password')

		if not email or not password:
			return JsonResponse({'message': 'Email and password are required.'}, status=400)

		user = authenticate(req, username=email, password=password)

		if user is not None:
			auth_login(req, user)
			return JsonResponse({'message': 'Login successful'}, status=200)
		else:
			return JsonResponse({'message': 'Invalid email or password.'}, status=401)
	return JsonResponse({'message': 'Invalid request method'}, status=405)

def logout(req):
	if req.user.is_authenticated:
		auth_logout(req)
		return JsonResponse({'message': 'Logout successful'}, status=200)
	return JsonResponse({'message': 'Logout unsuccess'}, status=400)

def register(req):
	if req.method == 'POST':
		username = req.POST['username']
		email = req.POST['email']
		password = req.POST['password']
		repeat_password = req.POST['repeat_password']

		if not username or not email or not password or not repeat_password:
			return JsonResponse({'message': 'All fields are required.'}, status=400)

		if password != repeat_password:
			return JsonResponse({'message': 'Passwords do not match.'}, status=400)
		
		if User.objects.filter(username=username).exists():
			return JsonResponse({'message': 'Username already taken.'}, status=400)

		if User.objects.filter(email=email).exists():
			return JsonResponse({'message': 'Email already registered.'}, status=400)

		user = User(username=username, email=email)
		user.set_password(password)
		user.save()

		return JsonResponse({'message': 'Register successful'}, status=200)
	return JsonResponse({'message': 'Invalid request method'}, status=405)

@login_required
def change_password(req):
	pass

@login_required
def change_username(req):
	print(req.user.username)
	return JsonResponse({'message': 'username changed'}, status=200)

@login_required
def profile(req, username):
	try:
		context = get_user_profile_data(username)
		return JsonResponse(context, status=200)
	except User.DoesNotExist:
		return JsonResponse({'message': 'User not found'}, status=404)
	except Exception as e:
		return JsonResponse({'message': str(e)}, status=500)
	

# Utilize functions

def get_user_profile_data(username):
    """
    Utility function to fetch user and profile data.
    Returns a dictionary with the user's profile information.
    Raises `User.DoesNotExist` if the user is not found.
    """
    user = User.objects.get(username=username)
    profile, created = Profile.objects.get_or_create(user=user)
    return {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': profile.avatar.url if profile.avatar else None,
        'banner': profile.banner.url if profile.banner else None,
        'description': profile.description,
        'is_student': profile.is_student,
        'friends': list(profile.friends.values_list('user__username', flat=True)),
    }

def get_user_match_history(username):
    """
    Utility function to fetch match history related to a specific user.
    Returns a list of dictionaries, each representing a match.
    Raises `User.DoesNotExist` if the user is not found.
    """
    user = User.objects.get(username=username)

    # Fetch matches where the user is player1 or player2
    matches = MatchHistory.objects.filter(Q(player1=user) | Q(player2=user)).order_by('-start_time')

    # Serialize match data
    match_history = []
    for match in matches:
        match_history.append({
            'id': match.id,
            'player1': match.player1.username,
            'player2': match.player2.username,
            'player1_score': match.player1_score,
            'player2_score': match.player2_score,
            'winner': match.winner.username if match.winner else None,
            'is_draw': match.is_draw,
            'start_time': match.start_time.strftime('%d-%m-%Y') if match.start_time else None,
            'end_time': match.end_time.strftime('%d-%m-%Y') if match.end_time else None,
            'match_duration': str(match.match_duration) if match.match_duration else None,
        })

    return {
        'user_id': user.id,
        'username': user.username,
        'match_history': match_history,
    }

def get_user_match_summary(username):
    """
    Utility function to fetch the match summary for a specific user.
    Returns a dictionary containing the user's wins, losses, total matches played, 
    goals scored, goals conceded, win rate, and goal difference.
    Raises `User.DoesNotExist` if the user is not found.
    """
    user = User.objects.get(username=username)

    # Fetch matches where the user participated
    matches = MatchHistory.objects.filter(Q(player1=user) | Q(player2=user))

    # Wins
    wins = matches.filter(winner=user).count()

    # Losses (total matches played - wins - draws)
    total_matches = matches.count()
    draws = matches.filter(is_draw=True).count()
    losses = total_matches - wins - draws

    # Goals Scored and Conceded
    goals_scored_as_player1 = matches.filter(player1=user).aggregate(total=Sum('player1_score'))['total'] or 0
    goals_scored_as_player2 = matches.filter(player2=user).aggregate(total=Sum('player2_score'))['total'] or 0
    goals_scored = goals_scored_as_player1 + goals_scored_as_player2

    goals_conceded_as_player1 = matches.filter(player1=user).aggregate(total=Sum('player2_score'))['total'] or 0
    goals_conceded_as_player2 = matches.filter(player2=user).aggregate(total=Sum('player1_score'))['total'] or 0
    goals_conceded = goals_conceded_as_player1 + goals_conceded_as_player2

    # Win Rate
    win_rate = (wins / total_matches * 100) if total_matches > 0 else 0

    # Goal Difference
    goal_difference = goals_scored - goals_conceded

    return {
        'wins': wins,
        'losses': losses,
        'draws': draws,
        'total_matches': total_matches,
        'goals_scored': goals_scored,
        'goals_conceded': goals_conceded,
        'win_rate': round(win_rate, 2),  # Rounded to 2 decimal places
        'goal_diff': goal_difference,
    }

def is_user_online(user):
    last_activity = user.profile.last_activity
    if last_activity:
        timeout_period = timedelta(seconds=300)  # Match SESSION_COOKIE_AGE
        return now() - last_activity < timeout_period
    return False