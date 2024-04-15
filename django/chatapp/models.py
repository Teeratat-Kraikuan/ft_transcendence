from django.db import models
from users.models import CustomUser

# Create your models here.
class Room(models.Model):
	name = models.CharField()
	slug = models.SlugField()

	def __str__(self):
		return self.name

class Message(models.Model):
	content = models.TextField()
	user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	create_on = models.DateTimeField(auto_now_add=True)