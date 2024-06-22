from django.contrib import admin
from .models import PongGame, Tournament, TournamentParticipant

# Register your models here.
admin.site.register(PongGame)
admin.site.register(Tournament)
admin.site.register(TournamentParticipant)
