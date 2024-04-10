#!/bin/sh

while ! /home/django/ft_transcendence/manage.py sqlflush > /dev/null 2>&1 ;do
	echo "Waiting for the db to be ready."
	sleep 1
done

if [ -d "/home/django/ft_transcendence" ]
then
	python /home/django/ft_transcendence/manage.py makemigrations
	python /home/django/ft_transcendence/manage.py migrate
	python /home/django/ft_transcendence/manage.py runserver 0.0.0.0:8000
fi

exec "$@"