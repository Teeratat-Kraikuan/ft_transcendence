from django.db import models
from users.models import CustomUser

# Create your models here.
class Room(models.Model):
	name = models.CharField()
	slug = models.SlugField()
	user1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user1', default=1)
	user2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user2', default=2)

	def __str__(self):
		return self.name
	
	@staticmethod
	def create_room(user1, user2):
		room_slug = '_'.join(sorted([user1.username, user2.username]))
		existing_room = Room.objects.filter(slug=room_slug).exists()
		if not existing_room:
			Room.objects.create(name=room_slug, slug=room_slug, user1=user1, user2=user2)

class Message(models.Model):
	content = models.TextField()
	is_link = models.BooleanField(default=False)
	user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	create_on = models.DateTimeField(auto_now_add=True)