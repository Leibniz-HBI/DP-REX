"Utils for VrAN"
from datetime import datetime, timezone

from django.contrib.auth.models import AbstractUser
from django.db import models
from ninja import Schema


class EmptyResponse(Schema):
    # pylint: disable=too-few-public-methods
    "Empty API Response"


class VranUser(AbstractUser):
    # pylint: disable=too-few-public-methods
    "User Model for VrAN"
    email = models.EmailField(unique=True)
    id_persistent = models.UUIDField(unique=True)


def timestamp():
    "Create a timezone aware timestamp"
    return datetime.now(timezone.utc)
