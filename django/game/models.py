from django.db import models
from users.models import CustomUser
import json

# Create your models here.
class PongGame(models.Model):
	room_code = models.CharField()
	player1 = models.CharField()
	player2 = models.CharField(default='to-be-decide')
	player_in_room = models.IntegerField(default=0)
	ball_x = models.FloatField(default=400)
	ball_y = models.FloatField(default=200)
	ballSpeedX = models.IntegerField(default=5)
	ballSpeedY = models.IntegerField(default=5)
	ballSize = models.IntegerField(default=5)
	paddle1_y = models.FloatField(default=150)
	paddle2_y = models.FloatField(default=150)
	paddleWidth = models.IntegerField(default=10)
	paddleHeight = models.IntegerField(default=100)
	paddleSpeed = models.IntegerField(default=10)
	player1_score = models.IntegerField(default=0)
	player2_score = models.IntegerField(default=0)

	def __str__(self):
		return self.room_code
	
	def get_game_state(self):
		game_state = {
            "player1": self.player1,
            "player2": self.player2,
            "ball_x": self.ball_x,
            "ball_y": self.ball_y,
            "paddle1_y": self.paddle1_y,
            "paddle2_y": self.paddle2_y,
            "player1_score": self.player1_score,
            "player2_score": self.player2_score,
        }
		return json.dumps(game_state)
	
class Tournament(models.Model):
	STATUS_CHOICES = (
        ("open", "Opened"),
        ("started", "Started"),
        ("ended", "Ended")
    )
	
	name = models.CharField(max_length=100)
	status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
	start_date = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"{self.name}"
	
	def is_full(self):
		return self.participants.count() >= 4
	
class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=100)

    class Meta:
        unique_together = ('tournament', 'user')
    
    def __str__(self):
        return f"{self.nickname} in {self.tournament.name}"
	
class MatchTournament(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    player1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='player1_matches')
    player2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='player2_matches')
    winner = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    match_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tournament', 'player1', 'player2')
        indexes = [
            models.Index(fields=['tournament', 'player1']),
            models.Index(fields=['tournament', 'player2']),
        ]
        ordering = ['match_date']
        verbose_name = 'Match Tournament'
        verbose_name_plural = 'Match Tournaments'

    def __str__(self):
        return f"Match between {self.player1.username} and {self.player2.username} in {self.tournament.name}"

    def set_winner(self, winner, score1, score2):
        """
        Set the winner of the match and update the scores.
        """
        if winner not in [self.player1, self.player2]:
            raise ValueError("Winner must be one of the match participants")
        self.winner = winner
        self.player1_score = score1
        self.player2_score = score2
        self.save()