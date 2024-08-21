from django.shortcuts import render

# Create your views here.
def settings(req):
	return render(req, 'settings.html')
