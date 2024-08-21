from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

# Create your views here.

def login(req):
	if req.method == 'POST':
		username = req.POST['email']
		password = req.POST['password']
		# user = auth.authenticate(username=username, password=password, is_student=False)
		# if user is not None:
		# 	auth.login(req, user)
		# 	html_content = render_to_string('home.html', {'user': user})
		return JsonResponse({'success': True, 'success': 'login successful'}, status=200)
	return JsonResponse({'success': False, 'error': 'invalid input'}, status=400)

def register(req):
	return

@login_required
def profile(req):
	return
