from django.shortcuts import render, redirect

# Create your views here.
def pong(request):
	return render(request, "pong.html")

def tournament(request):
	if not request.user.is_authenticated:
		return redirect('login')
	return render(request, 'tournament.html')