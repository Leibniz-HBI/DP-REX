"""Views for the VrAN Django app."""
from django.http import HttpResponse


def index(_):
    """Test request for VrAN."""
    return HttpResponse("Hello, VrAN.")
