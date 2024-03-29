# pylint: disable=duplicate-code
"""
Django settings for django_project project.

Generated by 'django-admin startproject' using Django 4.1.3.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

from os import environ
from pathlib import Path

# Load environment file.

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: don't run with debug turned on in production!

CONTRIBUTION_DIRECTORY = "/srv/vran/contributions"


###################################################################
# SECURITY WARNING: keep the secret key used in production secret!
# PLEASE add your own secret.
@property
def SECRET_KEY():  # pylint: disable=invalid-name
    "Get the secret key from environment."
    return get_docker_compose_secret("vran_django_key")


def get_docker_compose_secret(secret_name):
    "Get secret as provided by docker_compose"
    try:
        with open(f"/run/secrets/{secret_name}", encoding="utf-8") as key_file:
            key = key_file.readline().rstrip("\n")
    except FileNotFoundError:
        env_var_name = secret_name.upper()
        key = environ.get(env_var_name)
    if not key:
        raise Exception(  # pylint: disable=broad-exception-raised
            f"Please set the {secret_name} secret."
        )
    return key


###################################################################
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "vran-poc.duckdns.org"]


CORS_ALLOWED_ORIGINS = []

SESSION_COOKIE_SECURE = True

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "corsheaders",
    "django_rq",
    "vran",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "django_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "django_project.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": get_docker_compose_secret("vran_db_name"),
        "USER": get_docker_compose_secret("vran_db_user"),
        "PASSWORD": get_docker_compose_secret("vran_db_password"),
        "HOST": "vran_db",
        "PORT": "5432",
        # "OPTIONS": {
        # "service": "vran_service",
        # "passfile": "/run/secrets/pgconf",
        # },
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = "/var/www/vran-poc.duckdns.org/static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "vran.VranUser"

RQ_QUEUES = {
    "default": {
        "HOST": "vran_redis",
        "PORT": 6379,
        "DB": 0,
        "DEFAULT_TIMEOUT": 360,
        "PASSWORD": get_docker_compose_secret("vran_redis_password"),
    }
}


CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://vran_redis:6379",
        "OPTIONS": {"password": get_docker_compose_secret("vran_redis_password")},
    },
    "tag_definition_name_paths": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://vran_redis:6379",
        "OPTIONS": {"password": get_docker_compose_secret("vran_redis_password")},
        "KEY_PREFIX": "tag_definition_name_path",
    },
    "entity_display_txt_information": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://vran_redis:6379",
        "OPTIONS": {"password": get_docker_compose_secret("vran_redis_password")},
        "KEY_PREFIX": "entity_display_txt_information",
    },
}

IS_UNITTEST = False

LOGGING = {
    "version": 1,
    "formatters": {
        "verbose": {
            "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
        },
        "simple": {"format": "%(levelname)s %(message)s"},
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {},
    # "root": {
    #     "level": "DEBUG",
    #     "handlers": ["console"],
    # },
}
