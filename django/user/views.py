from django.shortcuts import render

# Create your views here.
def profile(req):
	return render(req, 'profile.html')
