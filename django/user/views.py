from django.shortcuts import render

# Create your views here.
def user(req, username):
	return render(req, 'user.html', {
		"username": username
	})
