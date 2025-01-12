import uuid
from django.contrib.auth.models import User
from django.db import models
from django.utils.timezone import now

class MatchHistory(models.Model):
    # Players
    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_as_player2')

    # Game Type
    game_type = models.TextField('Game Type', max_length=20, default="")
    
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

def generate_unique_match_id():
    return str(uuid.uuid4())[:6]

class MatchRoom(models.Model):
    match_id = models.CharField(
        max_length=50,
        unique=True,
        default=generate_unique_match_id
    )
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_matches')
    player2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='joined_matches')
    started = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.match_id

    @property
    def is_full(self):
        return self.player2 is not None

    @property
    def can_join(self):
        return not self.started and not self.is_full

class Tournament(models.Model):
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    last_round = models.PositiveIntegerField(default=0)
    end_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.name

class Player(models.Model):
    name = models.CharField(max_length=100)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='players')

    # Option 1: Store points as a field that can be updated (if you want to update after each match)
    points = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name

    def record_win(self):
        """Increases player's points based on win."""
        self.points += 3
        self.save()

    def record_loss(self):
        """Record loss - for now no points given for loss."""
        # In case you later want to track losses, you could add logic here.
        pass

class Match(models.Model):
    played = models.BooleanField(default=False)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    round_number = models.PositiveIntegerField(default=0)
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='matches_as_player2')
    player1_score = models.PositiveIntegerField(default=0)
    player2_score = models.PositiveIntegerField(default=0)
    winner = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='wins', null=True, blank=True)
    date_played = models.DateField(auto_now_add=True)

    def clean(self):
        # Prevent a match where both players are the same
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")
        # Ensure both players belong to the same tournament
        if self.player1.tournament != self.tournament or self.player2.tournament != self.tournament:
            raise ValidationError("Both players must be in the same tournament.")

        # Optionally, you can enforce that each pairing happens only once.
        if self.pk is None:  # if creating a new match
            existing = Match.objects.filter(
                tournament=self.tournament
            ).filter(
                models.Q(player1=self.player1, player2=self.player2) |
                models.Q(player1=self.player2, player2=self.player1)
            )
            if existing.exists():
                raise ValidationError("This match between these two players already exists.")

    def save(self, *args, **kwargs):
        # First, call clean to validate fields.
        self.clean()

        # Save the match
        super().save(*args, **kwargs)

        # Update player points if there's a winner.
        # Note: This example assumes that a match result is recorded only once and not changed.
        if self.winner:
            # To avoid adding points multiple times if the match is re-saved,
            # you might want to implement additional checks or signals.
            self.winner.record_win()
            # Optionally record loss for the other player (if needed)
            loser = self.player1 if self.winner != self.player1 else self.player2
            loser.record_loss()

    def __str__(self):
        return f"{self.player1} vs {self.player2} ({self.tournament.name})"