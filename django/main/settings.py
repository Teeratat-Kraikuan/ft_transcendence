"""
Django settings for main project.

Generated by 'django-admin startproject' using Django 5.0.7.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

from pathlib import Path
from os import environ
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = environ.get('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = True
DEBUG = False

ALLOWED_HOSTS = [
	"*",
]

CSRF_TRUSTED_ORIGINS = [
	'https://42pong.com:8443',
	'http://42pong.com:8000',
	'http://127.0.0.1:8000',
	'https://127.0.0.1:8443',
	'http://localhost:8000',
	'https://localhost:8443',
]

CSRF_COOKIE_SECURE = True

LOGIN_URL = "/login"
LOGIN_REDIRECT_URL = "/home/"
REDIRECT_FIELD_NAME = "next"

AUTHENTICATION_BACKENDS = (
	'django.contrib.auth.backends.ModelBackend',
	'user.backends.EmailBackend',
)

# Application definition

INSTALLED_APPS = [
	'daphne',
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	# Dependencies
	'channels',
	'channels_postgres',
	'corsheaders',
	'django_sass',
	'django_otp',
	'django_otp.plugins.otp_totp',
	'rest_framework',
	'rest_framework_simplejwt',
	# Apps
	'menu',
	'home',
	'game',
	'chat',
	'user',
	'setting',
	'api',
]

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'user.middleware.UpdateLastActivityMiddleware',
	'user.middleware.JWTAuthenticationMiddleware',
	'django_otp.middleware.OTPMiddleware',
]

ROOT_URLCONF = 'main.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [
			BASE_DIR.joinpath('templates'),
			BASE_DIR.joinpath('menu')
		],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'main.wsgi.application'
ASGI_APPLICATION = "main.asgi.application"

# Channels

CHANNEL_LAYERS = {
	'default': {
		'BACKEND': 'channels_postgres.core.PostgresChannelLayer',
		'CONFIG': {
			'ENGINE': 'django.db.backends.postgresql',
			'NAME': environ.get('POSTGRES_DB'),
			'USER': environ.get('POSTGRES_USER'),
			'PASSWORD': environ.get('POSTGRES_PASSWORD'),
			'HOST': 'postgres',
			'PORT': 5432,
		}
	},
}

# Rest Framework


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
		'user.auth.CookieJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
		'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'SIGNING_KEY': environ.get('SECRET_KEY'),
    'ALGORITHM': 'HS256',
}

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.postgresql',
		'NAME': environ.get('POSTGRES_DB'),
		'USER': environ.get('POSTGRES_USER'),
		'PASSWORD': environ.get('POSTGRES_PASSWORD'),
		'HOST': 'postgres',
		'PORT': 5432,
	}
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
	},
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_ROOT = 'static_build/'

STATIC_URL = 'static/'

STATICFILES_DIRS = [
	BASE_DIR / "static",
	BASE_DIR / "bootstrap",
]

MEDIA_ROOT = 'media/'

MEDIA_URL = 'media/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
