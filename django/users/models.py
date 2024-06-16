from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class CustomUser(AbstractUser):
	username = models.CharField(max_length=150, unique=True)
	profile_image = models.ImageField(default='profile_pics/default_profile_image.png', upload_to='profile_pics')
	banner_image = models.ImageField(default='banner_pics/default_banner_image.png', upload_to='banner_pics')
	description = models.TextField('Description', max_length=600, default="I am the winner")
	wins = models.IntegerField(default=0)
	loses = models.IntegerField(default=0)
	draws = models.IntegerField(default=0)
	is_student = models.BooleanField(default=False)
	friends = models.ManyToManyField('self', blank=True)
	blocked_user = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='blocked_by')
	active = models.IntegerField(default=0)

	def __str__(self):
		return self.username
	
	def add_friend(self, account):
		if account not in self.friends.all():
			self.friends.add(account)
	
class FriendRequest(models.Model):
	from_user = models.ForeignKey(CustomUser, related_name='from_user', on_delete=models.CASCADE)
	to_user = models.ForeignKey(CustomUser, related_name='to_user', on_delete=models.CASCADE)

	def __str__(self):
		return self.from_user.username

