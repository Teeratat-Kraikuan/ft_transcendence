from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.
class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	avatar = models.ImageField(default='profile_pics/default_avatar.png', upload_to='avatar')
	banner = models.ImageField(default='banner_pics/default_banner.png', upload_to='banner')
	description = models.TextField('Description', max_length=600, default="I am the winner")
	friends = models.ManyToManyField('self', blank=True)
	blocked_user = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='blocked_by')
	is_student = models.BooleanField(default=False)

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
	
	# Signal trigger when creating user it will create profile automatically
	@receiver(post_save, sender=User)
	def create_or_update_user_profile(sender, instance, created, **kwargs):
		if created:
			Profile.objects.create(user=instance)
		instance.profile.save()