FROM python:3.12-bookworm

ENV PYTHONUNBUFFERED 1

RUN apt-get update -y && apt-get upgrade -y

RUN pip install --upgrade pip
RUN pip install django \
				psycopg2 \
				python-dotenv \
				requests \
				Pillow

COPY ./django /home/django/ft_transcendence

WORKDIR /home/django/ft_transcendence

COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh 
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]