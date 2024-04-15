from django.urls import path, include
from chatapp import views

urlpatterns = [
	path('', views.chat, name='chat'),
	path('<str:slug>', views.room, name='room'),
]