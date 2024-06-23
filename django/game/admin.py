from django.contrib import admin
from .models import PongGame, Tournament, TournamentParticipant, MatchTournament, TournamentPongGame

# Register your models here.
admin.site.register(PongGame)
admin.site.register(Tournament)
admin.site.register(TournamentParticipant)
admin.site.register(MatchTournament)
admin.site.register(TournamentPongGame)