from django.contrib import admin
from .models import MatchHistory, MatchRoom

# Register your models here.
admin.site.register(MatchHistory)
admin.site.register(MatchRoom)
