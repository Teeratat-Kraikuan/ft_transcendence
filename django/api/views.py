import io
import re
import os
import json
import qrcode
import base64
import random
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.db.models import Q, Sum, Count
from django.utils.timezone import now
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import views, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta
from user.models import Profile, FriendRequest
from game.models import MatchHistory, MatchRoom, Tournament, Player, Match
from menu.models import Notification
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import AnonymousUser
from itertools import combinations
import logging

logger = logging.getLogger(__name__)

# Create your views here.
class LoginWithJWT(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        twofa_code = request.data.get('twofa_code', None)

        if not email or not password:
            return Response(
                {'message': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=email, password=password)
        if user is None:
            return Response(
                {'message': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if hasattr(user, 'profile') and user.profile.is_2fa_enabled:
            if not twofa_code:
                return Response(
                    {'message': '2FA code is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                device = TOTPDevice.objects.get(user=user, name='default')
            except TOTPDevice.DoesNotExist:
                return Response(
                    {'message': '2FA is enabled but no TOTP device found.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            if not device.verify_token(twofa_code):
                return Response(
                    {'message': 'Invalid 2FA code.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response = Response({"message": "Login successful"}, status=status.HTTP_200_OK)

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            samesite='None',
            secure=True
        )
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            samesite='Strict',
            secure=True
        )
        return response
    
class LogoutJWT(APIView):
    permission_classes = []

    def post(self, request):
        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response
    
def login(req):
    if req.method == 'POST':
        email = req.POST.get('email')
        password = req.POST.get('password')
        twofa_code = req.POST.get('twofa_code')

        if not email or not password:
            return JsonResponse({'message': 'Email and password are required.'}, status=400)

        user = authenticate(req, username=email, password=password)

        if user is not None:
            if hasattr(user, 'profile') and user.profile.is_2fa_enabled:
                if not twofa_code:
                    return JsonResponse({'message': '2FA code is required.'}, status=400)
                
                try:
                    device = TOTPDevice.objects.get(user=user, name='default')
                except TOTPDevice.DoesNotExist:
                    return JsonResponse({
                        'message': '2FA is enabled but no TOTP device found.'
                    }, status=500)

                if device.verify_token(twofa_code):
                    auth_login(req, user)
                    response = JsonResponse({'message': 'Login successful'}, status=200)
                    response.set_cookie('loggedin', 'true', samesite='Lax', max_age=req.session.get_expiry_age())
                    return response
                else:
                    return JsonResponse({'message': 'Invalid 2FA code.'}, status=401)
            else:
                auth_login(req, user)
                response = JsonResponse({'message': 'Login successful'}, status=200)
                response.set_cookie('loggedin', 'true', samesite='Lax', max_age=req.session.get_expiry_age())
                return response
        else:
            return JsonResponse({'message': 'Invalid email or password.'}, status=401)
    return JsonResponse({'message': 'Invalid request method'}, status=405)

def logout(req):
	if req.user.is_authenticated:
		auth_logout(req)
		logout = JsonResponse({'message': 'Logout successful'}, status=200)
		logout.delete_cookie('loggedin', samesite='None')
		return logout
	return JsonResponse({'message': 'Logout unsuccess'}, status=400)

def register(req):
    if req.method == 'POST':
        username = req.POST.get('username', '').strip()
        email = req.POST.get('email', '').strip()
        password = req.POST.get('password', '')
        repeat_password = req.POST.get('repeat_password', '')

        if not username or not email or not password or not repeat_password:
            return JsonResponse({'message': 'All fields are required.'}, status=400)

        # Username sanitization
        if not re.match(r'^[a-zA-Z0-9_.-]{3,30}$', username):
            return JsonResponse({'message': 'Username must be 3-30 characters long and can only contain letters, numbers, underscores, dots, or hyphens.'}, status=400)

        # Password validation
        if password != repeat_password:
            return JsonResponse({'message': 'Passwords do not match.'}, status=400)

        if len(password) < 8:
            return JsonResponse({'message': 'Password must be at least 8 characters long.'}, status=400)

        if not any(char.islower() for char in password):
            return JsonResponse({'message': 'Password must contain at least one lowercase letter.'}, status=400)

        if not any(char.isupper() for char in password):
            return JsonResponse({'message': 'Password must contain at least one uppercase letter.'}, status=400)

        if not any(char.isdigit() for char in password):
            return JsonResponse({'message': 'Password must contain at least one digit.'}, status=400)

        if not any(char in "!@#$%^&*()-_=+[]{}|;:',.<>?/`~" for char in password):
            return JsonResponse({'message': 'Password must contain at least one special character.'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'message': 'Username already taken.'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'message': 'Email already registered.'}, status=400)

        user = User(username=username, email=email)
        user.set_password(password)
        user.save()

        return JsonResponse({'message': 'Register successful'}, status=200)

    return JsonResponse({'message': 'Invalid request method'}, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_username(req):
    new_username = req.POST.get('new_username', '').strip()

    if not new_username:
        return Response({'message': 'New username is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not re.match(r'^[a-zA-Z0-9_.-]{3,30}$', new_username):
        return Response({'message': 'Username must be 3-30 characters long and can only contain letters, numbers, underscores, dots, or hyphens.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=new_username).exists():
        return Response({'message': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    req.user.username = new_username
    req.user.save()
    return Response({'message': 'Username changed successfully'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(req):
    old_password = req.POST.get('old_password', '')
    new_password = req.POST.get('new_password', '')
    repeat_password = req.POST.get('repeat_password', '')

    if not old_password or not new_password or not repeat_password:
        return Response({'message': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not req.user.check_password(old_password):
        return Response({'message': 'Invalid old password.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != repeat_password:
        return Response({'message': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'message': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

    if not any(char.islower() for char in new_password):
        return Response({'message': 'Password must contain at least one lowercase letter.'}, status=status.HTTP_400_BAD_REQUEST)

    if not any(char.isupper() for char in new_password):
        return Response({'message': 'Password must contain at least one uppercase letter.'}, status=status.HTTP_400_BAD_REQUEST)

    if not any(char.isdigit() for char in new_password):
        return Response({'message': 'Password must contain at least one digit.'}, status=status.HTTP_400_BAD_REQUEST)

    if not any(char in "!@#$%^&*()-_=+[]{}|;:',.<>?/`~" for char in new_password):
        return Response({'message': 'Password must contain at least one special character.'}, status=status.HTTP_400_BAD_REQUEST)

    req.user.set_password(new_password)
    req.user.save()
    return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(req, username):
	try:
		context = get_user_profile_data(username)
		return Response(context, status=status.HTTP_200_OK)
	except User.DoesNotExist:
		return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
	except Exception as e:
		return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(req):
    try:
        body = json.loads(req.body)
        friend_username = body.get('friend_username')
        
        if not friend_username:
            return Response({'message': 'Friend username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if req.user.username == friend_username:
            return Response({'message': 'You cannot send a friend request to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(username=friend_username)
        except User.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if FriendRequest.objects.filter(sender=req.user, receiver=receiver, status='pending').exists():
            return Response({'message': 'Friend request already sent.'}, status=status.HTTP_400_BAD_REQUEST)

        if receiver.profile in req.user.profile.friends.all():
            return Response({'message': 'You are already friends.'}, status=status.HTTP_400_BAD_REQUEST)

        FriendRequest.objects.create(sender=req.user, receiver=receiver)
        Notification.objects.create(
            user=receiver,
            notification_type='friend_request',
            message=f'%username% has sent a friend request to you.',
            friend_request=FriendRequest.objects.get(sender=req.user, receiver=receiver, status='pending')
        )

        return Response({'message': 'Friend request sent.'}, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response({'message': 'Invalid JSON data.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(req):
    try:
        body = json.loads(req.body)
        sender_username = body.get('sender_username')
        if not sender_username:
            return Response({'message': 'Sender username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print(sender_username)
            sender = User.objects.get(username=sender_username)
        except User.DoesNotExist:
            return Response({'message': 'Sender not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            friend_request = FriendRequest.objects.get(sender=sender, receiver=req.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'message': 'No pending friend request from this user.'}, status=status.HTTP_404_NOT_FOUND)

        friend_request.status = 'accepted'
        friend_request.save()

        req.user.profile.friends.add(sender.profile)
        sender.profile.friends.add(req.user.profile)

        return Response({'message': 'Friend request accepted.'}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_friend_request(req):
    try:
        body = json.loads(req.body)
        sender_username = body.get('sender_username')
        if not sender_username:
            return Response({'message': 'Sender username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sender = User.objects.get(username=sender_username)
        except User.DoesNotExist:
            return Response({'message': 'Sender not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            friend_request = FriendRequest.objects.get(sender=sender, receiver=req.user, status='pending')
        except FriendRequest.DoesNotExist:
            return Response({'message': 'No pending friend request from this user.'}, status=status.HTTP_404_NOT_FOUND)

        friend_request.status = 'declined'
        friend_request.save()

        return Response({'message': 'Friend request declined.'}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(req):
    logger.debug(f"User: {req.user}, Is Authenticated: {req.user.is_authenticated}")
    if isinstance(req.user, AnonymousUser):
        return Response({'message': 'Unauthorized user'}, status=status.HTTP_401_UNAUTHORIZED)
    
    notifications = Notification.objects.filter(user=req.user).order_by('-created_at')

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

    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(req):
    notification_id = req.POST.get('notification_id')
    if not notification_id:
        return Response({'message': 'notification_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        notification = Notification.objects.get(id=notification_id, user=req.user)
    except Notification.DoesNotExist:
        return Response({'message': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    notification.is_read = True
    notification.save()
    return Response({'message': 'Notification marked as read'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_notification(req):
    body = json.loads(req.body)
    notification_id = body.get('notification_id')
    if not notification_id:
        return Response({'message': 'notification_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        notification = Notification.objects.get(id=notification_id, user=req.user)
    except Notification.DoesNotExist:
        return Response({'message': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    notification.delete()
    return Response({'message': 'Notification removed'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def edit_user_profile(req):
    print("----TEST EDIT----") # Debug
    if req.method == 'POST':
        username = req.POST.get('username')
        if username:
            user = User.objects.get(username=username)
            profile = Profile.objects.get(user=user)
            if req.POST.get('submit') == 'edit':
                profile_image = req.FILES.get('profile_image')
                banner_image = req.FILES.get('banner_image')
                description = req.POST.get('description')
                if profile_image:
                    if profile.avatar and profile.avatar != 'default/default_avatar.jpg':
                        old_avatar_path = profile.avatar.path
                        if os.path.exists(old_avatar_path):
                            os.remove(old_avatar_path)
                    profile.avatar = profile_image
                if banner_image:
                    if profile.banner and profile.banner != 'default/default_banner.jpg':
                        old_banner_path = profile.banner.path
                        if os.path.exists(old_banner_path):
                            os.remove(old_banner_path)
                    profile.banner = banner_image
                if description and description != profile.description:
                    profile.description = description
                profile.save()
            elif req.POST.get('submit') == 'delete-avatar':
                if profile.avatar and profile.avatar != 'default/default_avatar.jpg':
                    old_avatar_path = profile.avatar.path
                    if os.path.exists(old_avatar_path):
                        os.remove(old_avatar_path)
                    profile.avatar = 'default/default_avatar.jpg'
                    profile.save()
            elif req.POST.get('submit') == 'delete-banner':
                if profile.banner and profile.banner != 'default/default_banner.jpg':
                    old_banner_path = profile.banner.path
                    if os.path.exists(old_banner_path):
                        os.remove(old_banner_path)
                    profile.banner = 'default/default_banner.jpg'
                    profile.save()
            return JsonResponse({'success': True, 'message': 'Profile updated successfully.'})
        else:
            return JsonResponse({'success': False, 'errors': 'Invalid submission.'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agree_privacy(req):
    is_agree_privacy = req.POST.get("is_agree_privacy") == "true"
    if is_agree_privacy:
        user = req.user
        user.profile.is_agree_privacy = True
        user.profile.save()
        return Response({'message': 'Privacy policy agreed'}, status=status.HTTP_200_OK)
    return Response({'message': 'Privacy policy not agreed'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

            return Response({
                    'message': '2FA enabled',
                    'qr_code': img_str,
                    'config_url': device.config_url
                }, status=status.HTTP_200_OK)
        else:
            user.profile.is_2fa_enabled = False
            user.profile.save()
            return Response({'message': '2FA disabled'}, status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response({'message': 'Invalid JSON data.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def entry_online_game(req):
    if req.POST.get('type') == 'create':
        room_code = str(random.randint(111111,999999))
        print(f"Create room: {room_code}")
    elif req.POST.get('type') == 'join':
        room_code = req.POST.get('code')
        print(f"Join room: {room_code}")             
    return Response({'message': 'Room code created'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_matchroom(request):
    try:
        match = MatchRoom.objects.create(host=request.user)
        return Response({
            'message': 'Matchroom created successfully',
            'match_id': match.match_id
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print("Error: ", e)
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_matchroom(request):
    try:
        body = request.data
        match_id = body.get('match_id')

        if not match_id:
            return Response({'message': 'match_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        match = get_object_or_404(MatchRoom, match_id=match_id)

        if match.started:
            if request.user == match.host or request.user == match.player2:
                match.last_active = now()
                return Response({
                    'message': 'Reconnected to match successfully',
                    'match_id': match.match_id
                }, status=status.HTTP_200_OK)
            else:
                return Response({'message': 'Match has already started.'}, status=status.HTTP_400_BAD_REQUEST)

        if not match.can_join:
            return Response({'message': 'Match is either full or already started.'}, status=status.HTTP_400_BAD_REQUEST)

        match.player2 = request.user
        match.started = True
        match.last_active = now()
        match.save()

        return Response({
            'message': 'Joined match successfully',
            'match_id': match.match_id
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tournament(request):
    try:
        body = request.data
        members = body.get('members')
        
        if not members or len(members) < 2:
            return Response(
                {'error': 'At least 2 members are required to create a tournament.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print("Members: ", members)

        tournament = Tournament.objects.create(name='Tournament', start_date=now())

        players = []
        for member in members:
            player = Player.objects.create(name=member, tournament=tournament)
            players.append(player)

        match_schedule = []
        for round_num, (player1, player2) in enumerate(combinations(players, 2), start=1):
            match_schedule.append({
                "tournament": tournament,
                "round_number": round_num,
                "player1": player1,
                "player2": player2,
            })

        for match_data in match_schedule:
            Match.objects.create(**match_data)
        
        for match in match_schedule:
            print(match)

        return Response({
            'message': 'Tournament created successfully with matches.',
            'tournament_id': tournament.id,
            'total_matches': len(match_schedule),
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_score(request):
    try:
        data = request.data
        match_id = data.get('match_id')
        player1_score = data.get('player1')
        player2_score = data.get('player2')

        match = Match.objects.get(id=match_id)
        match.played = True 
        match.player1_score = player1_score
        match.player2_score = player2_score
        match.winner = match.player1 if player1_score > player2_score else match.player2
        match.save()

        return Response({
            'message': 'Match result submitted successfully',
            'winner': match.winner.name
        }, status=status.HTTP_200_OK)
    except KeyError:
        return Response({'message': 'match_id, player1_score, and player2_score are required.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_visibility(req):
    try: 
        body = json.loads(req.body)
        user = req.user
        enabled = body.get('enable', False)
        if enabled:
            user.profile.is_anonymous = True
            if user.profile.avatar and user.profile.avatar.url != '/media/default/default_avatar.jpg':
                old_avatar_path = user.profile.avatar.path
                if os.path.exists(old_avatar_path):
                    os.remove(old_avatar_path)
            if user.profile.banner and user.profile.banner.url != '/media/default/default_banner.jpg':
                old_banner_path = user.profile.banner.path
                if os.path.exists(old_banner_path):
                    os.remove(old_banner_path)
            user.profile.description = 'I am the winner'
            user.profile.avatar = 'default/default_avatar.jpg'
            user.profile.banner = 'default/default_banner.jpg'
            user.profile.save()
            get_user_match_history(user.username, delete=True)
            return Response({ 'message': 'Anonymous enabled'}, status=status.HTTP_200_OK)
        else:
            user.profile.is_anonymous = False
            user.profile.save()
            return Response({'message': 'Anonymous disabled'}, status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response({'message': 'Invalid JSON data.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'message': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(req):
    print("----TEST DELETE----")
    user = req.user
    print("Delete account: ", user.username)
    if user.profile.avatar and user.profile.avatar.url != '/media/default/default_avatar.jpg':
        old_avatar_path = user.profile.avatar.path
        if os.path.exists(old_avatar_path):
            os.remove(old_avatar_path)
    if user.profile.banner and user.profile.banner.url != '/media/default/default_banner.jpg':
        old_banner_path = user.profile.banner.path
        if os.path.exists(old_banner_path):
            os.remove(old_banner_path)
    print("Image already deleted")
    get_user_match_history(user.username, delete=True)
    print("Remove match history")
    user.delete()
    print("Delete account success")
    return Response({'message': 'Account deleted'}, status=status.HTTP_200_OK)

# Utilize functions

def get_user_profile_data(username):
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
        'is_anonymous': profile.is_anonymous,
        'friends': list(profile.friends.order_by('user__username').values_list('user__username', flat=True)),
        'pending_friend_requests': [
            {'sender_username': fr.sender.username, 'timestamp': fr.timestamp}
            for fr in pending_requests
        ],
    }

def get_user_anonymous_name(username):
    if is_user_anonymous(username):
        return 'Anonymous'
    else:
        return username

def get_user_match_history(username, delete=False):
    user = User.objects.get(username=username)

    if delete:
        matches_deleted, _ = MatchHistory.objects.filter(Q(player1=user) | Q(player2=user)).delete()
        return {"message": f"{matches_deleted} matches deleted for user {username}."}

    matches = MatchHistory.objects.filter(Q(player1=user) | Q(player2=user)).order_by('-start_time')

    match_history = []
    for match in matches:
        match_history.append({
            'id': match.id,
            # 'player1': get_user_anonymous_name(match.player1.username),
            # 'player2': get_user_anonymous_name(match.player2.username),
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
    user = User.objects.get(username=username)

    matches = MatchHistory.objects.filter(Q(player1=user) | Q(player2=user))

    wins = matches.filter(winner=user).count()

    total_matches = matches.count()
    draws = matches.filter(is_draw=True).count()
    losses = total_matches - wins - draws

    goals_scored_as_player1 = matches.filter(player1=user).aggregate(total=Sum('player1_score'))['total'] or 0
    goals_scored_as_player2 = matches.filter(player2=user).aggregate(total=Sum('player2_score'))['total'] or 0
    goals_scored = goals_scored_as_player1 + goals_scored_as_player2

    goals_conceded_as_player1 = matches.filter(player1=user).aggregate(total=Sum('player2_score'))['total'] or 0
    goals_conceded_as_player2 = matches.filter(player2=user).aggregate(total=Sum('player1_score'))['total'] or 0
    goals_conceded = goals_conceded_as_player1 + goals_conceded_as_player2

    win_rate = (wins / total_matches * 100) if total_matches > 0 else 0


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

def is_user_anonymous(username):
    profile = get_user_profile_data(username)
    return profile['is_anonymous']

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
