from django.shortcuts import render, redirect
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.core import serializers
from .models import Room, Message

# Create your views here.
@login_required
def chat(request):
	context = {}
	myChatRooms = Room.objects.filter(Q(user1=request.user) | Q(user2=request.user))
	friends = request.user.friends.all()
	context['rooms'] = myChatRooms
	context['friends'] = friends
	print(type(friends))
	return render(request, "chat.html", context)

@login_required
def room(request, slug):
	context = {}
	try:
		room = Room.objects.get(slug=slug)
	except:
		return redirect('home')
	if not room or (request.user != room.user1 and request.user != room.user2):
		return redirect('home')
	messages = Message.objects.filter(room=room)
	rooms = Room.objects.all()
	context['rooms'] = rooms
	context['room'] = room
	context['messages'] = messages
	context['friend'] = room.user2 if request.user.username == room.user1 else room.user1
	return render(request, "room.html", context)
