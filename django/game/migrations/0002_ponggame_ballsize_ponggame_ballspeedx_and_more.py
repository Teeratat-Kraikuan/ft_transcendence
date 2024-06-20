# Generated by Django 5.0.6 on 2024-06-21 00:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='ponggame',
            name='ballSize',
            field=models.IntegerField(default=5),
        ),
        migrations.AddField(
            model_name='ponggame',
            name='ballSpeedX',
            field=models.IntegerField(default=5),
        ),
        migrations.AddField(
            model_name='ponggame',
            name='ballSpeedY',
            field=models.IntegerField(default=5),
        ),
        migrations.AddField(
            model_name='ponggame',
            name='paddleHeight',
            field=models.IntegerField(default=100),
        ),
        migrations.AddField(
            model_name='ponggame',
            name='paddleSpeed',
            field=models.IntegerField(default=10),
        ),
        migrations.AddField(
            model_name='ponggame',
            name='paddleWidth',
            field=models.IntegerField(default=10),
        ),
    ]
