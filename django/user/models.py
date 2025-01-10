from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.
class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	avatar = models.ImageField(default='default/default_avatar.png', upload_to='avatar')
	banner = models.ImageField(default='default/default_banner.png', upload_to='banner')
	description = models.TextField('Description', max_length=600, default="I am the winner")
	friends = models.ManyToManyField('self', blank=True)
	is_student = models.BooleanField(default=False)
	is_agree_privacy = models.BooleanField(default=False)
	is_2fa_enabled = models.BooleanField(default=False)
	last_activity = models.DateTimeField(null=True, blank=True)

	def __str__(self):
		return self.user.username
	
	def authenticate(self, req, email=None, password=None, **kwargs):
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return None
		else:
			if user.check_password(password):
				return user
		return None
	
	def update_online_status(self, status: bool):
		"""Update the online status of the profile."""
		self.is_online = status
		self.save()
	
	# Signal trigger when creating user it will create profile automatically
	@receiver(post_save, sender=User)
	def create_or_update_user_profile(sender, instance, created, **kwargs):
		if created:
			Profile.objects.create(user=instance)
		instance.profile.save()

class FriendRequest(models.Model):
    sender = models.ForeignKey(
        User, related_name='sent_friend_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(
        User, related_name='received_friend_requests', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending')

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"FriendRequest from {self.sender.username} to {self.receiver.username} ({self.status})"