from django.db import models

# Create your models here.
class PongGame(models.Model):
	room_code = models.CharField()
	player1 = models.CharField()
	player2 = models.CharField(default='to-be-decide')
	game_state = models.TextField(default=None, null=True)
	plyaer_in_room = models.IntegerField(default=0)

	def __str__(self):
		return self.room_code