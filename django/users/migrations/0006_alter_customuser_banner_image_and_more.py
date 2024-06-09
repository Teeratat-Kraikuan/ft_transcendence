# Generated by Django 5.0.4 on 2024-06-08 23:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_alter_customuser_active'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='banner_image',
            field=models.ImageField(default='default_banner_image.png', upload_to='banner_pics'),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='profile_image',
            field=models.ImageField(default='default_profile_image.png', upload_to='profile_pics'),
        ),
    ]
