# Generated by Django 5.0.6 on 2024-06-16 18:14

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_alter_customuser_banner_image_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='blocked_user',
            field=models.ManyToManyField(blank=True, related_name='blocked_by', to=settings.AUTH_USER_MODEL),
        ),
    ]
