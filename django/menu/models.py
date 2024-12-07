from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Notification(models.Model):
    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    friend_request = models.ForeignKey('user.FriendRequest', null=True, blank=True, on_delete=models.SET_NULL)
    # tournament = models.ForeignKey('Tournament', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"Notification({self.notification_type}) to {self.user.username}"