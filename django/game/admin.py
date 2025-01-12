from django.contrib import admin
from .models import MatchHistory, MatchRoom, Tournament, Player, Match

# Register your models here.
admin.site.register(MatchHistory)
admin.site.register(MatchRoom)
admin.site.register(Tournament)
admin.site.register(Player)
admin.site.register(Match)
