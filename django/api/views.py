import io
import json
import qrcode
import base64
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.db.models import Q, Sum, Count
from django.utils.timezone import now
from django.views.decorators.http import require_GET, require_POST
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.shortcuts import render
from rest_framework import views, permissions
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from user.models import Profile, FriendRequest
from game.models import MatchHistory
from menu.models import Notification

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
def change_username(req):
    if req.method == 'POST':
        new_username = req.POST.get('new_username')
        if not new_username:
            return JsonResponse({'message': 'New username is required.'}, status=400)

        if User.objects.filter(username=new_username).exists():
            return JsonResponse({'message': 'Username already taken.'}, status=400)

        req.user.username = new_username
        req.user.save()
    return JsonResponse({'message': 'username changed'}, status=200)

@login_required
def change_password(req):
    if req.method == 'POST':
        old_password = req.POST.get('old_password')
        new_password = req.POST.get('new_password')
        repeat_password = req.POST.get('repeat_password')

        if not old_password or not new_password or not repeat_password:
            return JsonResponse({'message': 'All fields are required.'}, status=400)

        if not req.user.check_password(old_password):
            return JsonResponse({'message': 'Invalid old password.'}, status=400)

        if new_password != repeat_password:
            return JsonResponse({'message': 'Passwords do not match.'}, status=400)

        req.user.set_password(new_password)
        req.user.save()
        return JsonResponse({'message': 'Password changed'}, status=200)
    return JsonResponse({'message': 'Invalid request method'}, status=405)

@login_required
def profile(req, username):
	try:
		context = get_user_profile_data(username)
		return JsonResponse(context, status=200)
	except User.DoesNotExist:
		return JsonResponse({'message': 'User not found'}, status=404)
	except Exception as e:
		return JsonResponse({'message': str(e)}, status=500)
	
@login_required
@require_POST
def send_friend_request(req):
    try:
        # Parse JSON body
        body = json.loads(req.body)
        friend_username = body.get('friend_username')
        
        if not friend_username:
            return JsonResponse({'message': 'Friend username is required.'}, status=400)

        # Prevent sending a request to oneself
        if req.user.username == friend_username:
            return JsonResponse({'message': 'You cannot send a friend request to yourself.'}, status=400)

        # Fetch the receiver user
        try:
            receiver = User.objects.get(username=friend_username)
        except User.DoesNotExist:
            return JsonResponse({'message': 'User not found.'}, status=404)

        # Check if a FriendRequest already exists
        if FriendRequest.objects.filter(sender=req.user, receiver=receiver, status='pending').exists():
            return JsonResponse({'message': 'Friend request already sent.'}, status=400)

        # Check if they are already friends
        if receiver.profile in req.user.profile.friends.all():
            return JsonResponse({'message': 'You are already friends.'}, status=400)

        # Create a new FriendRequest
        FriendRequest.objects.create(sender=req.user, receiver=receiver)
        Notification.objects.create(
            user=receiver,
            notification_type='friend_request',
            message=f'{req.user.username} has sent a friend request to you.',
            friend_request=FriendRequest.objects.get(sender=req.user, receiver=receiver, status='pending')
        )

        return JsonResponse({'message': 'Friend request sent.'}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'message': 'Invalid JSON data.'}, status=400)
    except Exception as e:
        return JsonResponse({'message': f'An error occurred: {str(e)}'}, status=500)
	
@login_required
@require_POST
def accept_friend_request(req):
    try:
        # Get the sender's username from the request data
        sender_username = req.POST.get('sender_username')
        if not sender_username:
            return JsonResponse({'message': 'Sender username is required.'}, status=400)

        # Fetch the sender user
        try:
            print(sender_username)
            sender = User.objects.get(username=sender_username)
        except User.DoesNotExist:
            return JsonResponse({'message': 'Sender not found.'}, status=404)

        # Fetch the FriendRequest
        try:
            friend_request = FriendRequest.objects.get(sender=sender, receiver=req.user, status='pending')
        except FriendRequest.DoesNotExist:
            return JsonResponse({'message': 'No pending friend request from this user.'}, status=404)

        # Update the status to accepted
        friend_request.status = 'accepted'
        friend_request.save()

        # Add each other as friends
        req.user.profile.friends.add(sender.profile)
        sender.profile.friends.add(req.user.profile)

        return JsonResponse({'message': 'Friend request accepted.'}, status=200)

    except Exception as e:
        return JsonResponse({'message': f'An error occurred: {str(e)}'}, status=500)

@login_required
@require_POST
def decline_friend_request(req):
    try:
        # Get the sender's username from the request data
        sender_username = req.POST.get('sender_username')
        if not sender_username:
            return JsonResponse({'message': 'Sender username is required.'}, status=400)

        # Fetch the sender user
        try:
            sender = User.objects.get(username=sender_username)
        except User.DoesNotExist:
            return JsonResponse({'message': 'Sender not found.'}, status=404)

        # Fetch the FriendRequest
        try:
            friend_request = FriendRequest.objects.get(sender=sender, receiver=req.user, status='pending')
        except FriendRequest.DoesNotExist:
            return JsonResponse({'message': 'No pending friend request from this user.'}, status=404)

        # Update the status to declined
        friend_request.status = 'declined'
        friend_request.save()

        return JsonResponse({'message': 'Friend request declined.'}, status=200)

    except Exception as e:
        return JsonResponse({'message': f'An error occurred: {str(e)}'}, status=500)
    
@login_required
def list_notifications(req):
    # Fetch all notifications for the logged-in user, most recent first
    notifications = Notification.objects.filter(user=req.user).order_by('-created_at')

    
    # Serialize notifications into a list of dicts
    data = []
    for n in notifications:

        if n.notification_type == 'friend_request' and n.friend_request:
            sender_username = n.friend_request.sender.username
            if n.friend_request.status == 'accepted':
                continue
        else:
            sender_username = None

        data.append({
            'id': n.id,
            'notification_type': n.notification_type,
            'message': n.message,
            'sender_username': sender_username,
            'is_read': n.is_read,
            'created_at': n.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })

    return JsonResponse(data, safe=False, status=200)

@login_required
def mark_notification_as_read(req):
    if req.method == 'POST':
        notification_id = req.POST.get('notification_id')
        if not notification_id:
            return JsonResponse({'message': 'notification_id is required'}, status=400)

        try:
            notification = Notification.objects.get(id=notification_id, user=req.user)
        except Notification.DoesNotExist:
            return JsonResponse({'message': 'Notification not found'}, status=404)

        notification.is_read = True
        notification.save()
        return JsonResponse({'message': 'Notification marked as read'}, status=200)

    return JsonResponse({'message': 'Invalid request method'}, status=405)

@login_required
def remove_notification(req):
    if req.method == 'POST':
        notification_id = req.POST.get('notification_id')
        if not notification_id:
            return JsonResponse({'message': 'notification_id is required'}, status=400)

        try:
            notification = Notification.objects.get(id=notification_id, user=req.user)
        except Notification.DoesNotExist:
            return JsonResponse({'message': 'Notification not found'}, status=404)

        notification.delete()
        return JsonResponse({'message': 'Notification removed'}, status=200)

    return JsonResponse({'message': 'Invalid request method'}, status=405)

@login_required
def edit_user_profile(req):
    print("----TEST EDIT----") # Debug
    if req.method == 'POST':
        username = req.POST.get('username')
        if req.POST.get('submit') == 'edit' and username:

            profile_image = req.FILES.get('profile_image')
            banner_image = req.FILES.get('banner_image')
            description = req.POST.get('description')
            print(f"TEST EDIT : {description}, {profile_image}, {banner_image}") # Debug

            user = User.objects.get(username=username)
            profile = Profile.objects.get(user=user)

            if profile_image:
                profile.avatar = profile_image
            if banner_image:
                profile.banner = banner_image
            if description and description != profile.description:
                profile.description = description
            profile.save()
            return JsonResponse({'success': True, 'message': 'Profile updated successfully.'})
        else:
            return JsonResponse({'success': False, 'errors': 'Invalid submission.'}, status=400)

@login_required
def agree_privacy(req):
    print("----TEST PRIVACY----")
    if req.method == "POST":
        is_agree_privacy = req.POST.get("is_agree_privacy") == "true"
        if is_agree_privacy:
            user = req.user
            user.profile.is_agree_privacy = True
            user.profile.save()
    return JsonResponse({'message': 'Privacy agreement updated'}, status=200)

@login_required
@require_POST
def change_2fa(req):
    try: 
        body = json.loads(req.body)
        user = req.user
        enabled_2fa = body.get('enable', False)
        if enabled_2fa:
            device, created = TOTPDevice.objects.get_or_create(user=user, name='default')

            user.profile.is_2fa_enabled = True
            user.profile.save()

            img = qrcode.make(device.config_url)

            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)

            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')

            return JsonResponse({
                    'message': '2FA enabled',
                    'qr_code': img_str,
                    'config_url': device.config_url
                }, status=200)
        else:
            user.profile.is_2fa_enabled = False
            user.profile.save()
            return JsonResponse({'message': '2FA disabled'}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'message': 'Invalid JSON data.'}, status=400)
    except Exception as e:
        return JsonResponse({'message': f'An error occurred: {str(e)}'}, status=500)
    
# Utilize functions

def get_user_profile_data(username):
    """
    Utility function to fetch user and profile data.
    Returns a dictionary with the user's profile information.
    Raises `User.DoesNotExist` if the user is not found.
    """
    user = User.objects.get(username=username)
    profile, created = Profile.objects.get_or_create(user=user)

    pending_requests = FriendRequest.objects.filter(receiver=user, status='pending')

    return {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': profile.avatar.url if profile.avatar else None,
        'banner': profile.banner.url if profile.banner else None,
        'description': profile.description,
        'is_student': profile.is_student,
        'friends': list(profile.friends.order_by('user__username').values_list('user__username', flat=True)),
        'pending_friend_requests': [
            {'sender_username': fr.sender.username, 'timestamp': fr.timestamp}
            for fr in pending_requests
        ],
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
			'game_type': match.game_type,
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
        timeout_period = timedelta(seconds=300)
        return now() - last_activity < timeout_period
    return False

# TOTP 2FA
def get_user_totp_device(self, user, confirmed=None):
    devices = devices_for_user(user, confirmed=confirmed)
    for device in devices:
        if isinstance(device, TOTPDevice):
            return device
class TOTPCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, format=None):
        user = request.user
        device = get_user_totp_device(self, user)
        if not device:
            device = user.totpdevice_set.create(confirmed=False)
        url = device.config_url
        return Response(url, status=status.HTTP_201_CREATED)
class TOTPVerifyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, token, format=None):
        user = request.user
        device = get_user_totp_device(self, user)
        if not device == None and device.verify_token(token):
            if not device.confirmed:
                device.confirmed = True
                device.save()
            return Response(True, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)