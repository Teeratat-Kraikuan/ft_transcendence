from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, Http404
from django.core import serializers
from .models import Room, Message
from game.models import PongGame
import random

# Create your views here.
@login_required
def chat(request):
	context = {}
	rooms = Room.objects.filter(Q(user1=request.user) | Q(user2=request.user))
	selected_room = []
	for loop_room in rooms:
		if loop_room.user1 == request.user and loop_room.user2.active and not request.user.blocked_user.filter(username=loop_room.user2.username).exists():
			selected_room += [loop_room]
		elif loop_room.user2 == request.user and loop_room.user1.active and not request.user.blocked_user.filter(username=loop_room.user1.username).exists():
			selected_room += [loop_room]
	for loop_room in rooms:
		if loop_room.user1 == request.user and not loop_room.user2.active and not request.user.blocked_user.filter(username=loop_room.user2.username).exists():
			selected_room += [loop_room]
		elif loop_room.user2 == request.user and not loop_room.user1.active and not request.user.blocked_user.filter(username=loop_room.user1.username).exists():
			selected_room += [loop_room]
	context['rooms'] = selected_room
	friends = request.user.friends.all()
	context['rooms'] = selected_room
	context['friends'] = friends
	return render(request, "chat.html", context)

@login_required
def room(request, slug):
	context = {}
	try:
		room = get_object_or_404(Room, slug=slug)
	except:
		raise Http404()
	if not room or (request.user != room.user1 and request.user != room.user2):
		raise Http404()
	messages = Message.objects.filter(room=room)
	rooms = Room.objects.all()
	selected_room = []
	for loop_room in rooms:
		if loop_room.user1 == request.user and loop_room.user2.active and not request.user.blocked_user.filter(username=loop_room.user2.username).exists():
			selected_room += [loop_room]
		elif loop_room.user2 == request.user and loop_room.user1.active and not request.user.blocked_user.filter(username=loop_room.user1.username).exists():
			selected_room += [loop_room]
	for loop_room in rooms:
		if loop_room.user1 == request.user and not loop_room.user2.active and not request.user.blocked_user.filter(username=loop_room.user2.username).exists():
			selected_room += [loop_room]
		elif loop_room.user2 == request.user and not loop_room.user1.active and not request.user.blocked_user.filter(username=loop_room.user1.username).exists():
			selected_room += [loop_room]
	context['rooms'] = selected_room
	context['room'] = room
	context['messages'] = messages
	context['friend'] = room.user2 if request.user == room.user1 else room.user1
	return render(request, "room.html", context)

def invite(request):
	if request.method == "POST":
		friend_username = request.POST.get('username')
		if friend_username:
			room_code = None
			created = False
			while not created:
				room_code = str(random.randint(111111, 999999))
				pong_room, created = PongGame.objects.get_or_create(room_code=room_code, player1=request.user.username, player2=friend_username)
			return JsonResponse({'room_code': room_code})
	return JsonResponse({'error': 'Invalid request'}, status=400)
