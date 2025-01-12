# Generated by Django 5.0.8 on 2024-08-21 17:11

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('avatar', models.ImageField(default='default/default_avatar.png', upload_to='avatar')),
                ('banner', models.ImageField(default='default/default_banner.png', upload_to='banner')),
                ('description', models.TextField(default='I am the winner', max_length=600, verbose_name='Description')),
                ('is_student', models.BooleanField(default=False)),
                ('blocked_user', models.ManyToManyField(blank=True, related_name='blocked_by', to='user.profile')),
                ('friends', models.ManyToManyField(blank=True, to='user.profile')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
