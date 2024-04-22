from django.db import models

# Create your models here.
class PongGame(models.Model):
	room_code = models.CharField()
	player1 = models.CharField()
	player2 = models.CharField(default='to-be-decide')

	def __str__(self):
		return self.room_code