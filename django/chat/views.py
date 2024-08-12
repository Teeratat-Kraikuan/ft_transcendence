from django.shortcuts import render

# Create your views here.
def chat(req):
	return render(req, 'chat.html')
