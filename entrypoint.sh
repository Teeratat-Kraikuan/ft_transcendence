#!/bin/sh

while ! /home/django/ft_transcendence/manage.py sqlflush > /dev/null 2>&1 ;do
	echo "Waiting for the db to be ready."
	sleep 1
done

if [ -d "/home/django/ft_transcendence" ]
then
	python /home/django/ft_transcendence/manage.py makemigrations
	python /home/django/ft_transcendence/manage.py migrate
	python manage.py collectstatic
	# python /home/django/ft_transcendence/manage.py runserver 0.0.0.0:8000
	# python /home/django/ft_transcendence/manage.py runserver_plus --cert-file /home/django/ft_transcendence/https/cert.pem --key-file /home/django/ft_transcendence/https/key.pem 0.0.0.0:8000
	daphne -b 0.0.0.0 -p 8001 project.asgi:application
	# daphne -b 0.0.0.0 -p 8001 -e ssl:8443:privateKey=/home/django/ft_transcendence/https/key.pem:certKey=/home/django/ft_transcendence/https/cert.pem project.asgi:application --proxy-headers
fi

exec "$@"