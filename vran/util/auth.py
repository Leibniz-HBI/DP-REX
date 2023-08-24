"Utils for authentication"
from enum import Enum

from django.http import HttpRequest
from ninja.security import django_auth

from vran.exception import NotAuthenticatedException
from vran.util import VranUser


class VranPermission(Enum):
    # pylint: disable=too-few-public-methods
    "Permissions for VrAN"
    READ_DATA = "READ_DATA"
    UPLOAD_DATA = "UPLOAD_DATA"
    ASSIGN_CONTRIBUTOR = "ASSIGN_CONTRIBUTOR"
    REVIEW_DATA = "REVIEW_DATA"
    ASSIGN_GROUP = "ASSIGN_GROUP"


class VranGroup(Enum):
    # pylint: disable=too-few-public-methods
    "Groups for VrAN"
    APPLICANT = "APPLICANT"
    READER = "READER"
    CONTRIBUTOR = "CONTRIBUTOR"
    EDITOR = "EDITOR"
    COMMISSIONER = "COMMISSIONER"


def vran_auth(request: HttpRequest):
    """Workaround for cookie authentication.
    This is required to have sub paths without authorization
    where the parents use authorization."""
    return django_auth.authenticate(request, None)


def check_user(request):
    "Checks wether a request is authenticated, otherwise throws an exception."
    user = request.user
    if isinstance(user, VranUser):
        return user
    raise NotAuthenticatedException()
