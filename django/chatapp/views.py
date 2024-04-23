from django.shortcuts import render, redirect
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from .models import Room, Message

# Create your views here.
@login_required
def chat(request):
	context = {}
	myChatRooms = Room.objects.filter(Q(user1=request.user) | Q(user2=request.user))
	context['rooms'] = myChatRooms
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
	return render(request, "room.html", context)
