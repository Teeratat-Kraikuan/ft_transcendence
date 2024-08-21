from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# Create your views here.
@login_required
def settings(req):
	return render(req, 'settings.html')
