FROM python:3.12-bookworm

ENV PYTHONUNBUFFERED 1

RUN apt-get update -y && apt-get upgrade -y

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./django /home/django/ft_transcendence

WORKDIR /home/django/ft_transcendence

COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh 
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "/usr/local/bin/entrypoint.sh" ]
# CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]