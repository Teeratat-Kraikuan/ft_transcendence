from django.contrib.auth.models import User
from django.db import models
from django.utils.timezone import now

class MatchHistory(models.Model):
    # Players
    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_player2')
    
    # Scores
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    
    # Result
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='wins')
    is_draw = models.BooleanField(default=False)
    
    # Timestamps
    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Optional Stats
    match_duration = models.DurationField(null=True, blank=True)  # Duration of the match

    def save(self, *args, **kwargs):
        # Calculate winner or draw before saving
        if self.player1_score > self.player2_score:
            self.winner = self.player1
            self.is_draw = False
        elif self.player1_score < self.player2_score:
            self.winner = self.player2
            self.is_draw = False
        else:
            self.winner = None
            self.is_draw = True
        
        # Calculate match duration if end_time is set
        if self.start_time and self.end_time:
            self.match_duration = self.end_time - self.start_time

        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Match: {self.player1} vs {self.player2} ({self.start_time})"