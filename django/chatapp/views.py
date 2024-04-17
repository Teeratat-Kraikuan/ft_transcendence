from django.shortcuts import render, redirect
from .models import Room, Message

# Create your views here.
def chat(request):
	context = {}
	if not request.user.is_authenticated:
		return redirect('login')
	rooms = Room.objects.all()
	context['rooms'] = rooms
	return render(request, "chat.html", context)

def room(request, slug):
	context = {}
	room = Room.objects.get(slug=slug)
	messages = Message.objects.filter(room=room)
	rooms = Room.objects.all()
	context['rooms'] = rooms
	context['room'] = room
	context['messages'] = messages
	return render(request, "room.html", context)
