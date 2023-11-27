"""Registry for VrAN urls."""

from django.contrib import admin
from django.contrib.auth import authenticate, login
from django.urls import path
from ninja import NinjaAPI, Schema
from ninja.constants import NOT_SET

from vran.contribution.api import router as contribution_router
from vran.merge_request.router import router
from vran.person.api import router as person_router
from vran.tag.api.router import router as tag_router
from vran.user.api import router as user_router
from vran.util.auth import vran_auth

ninja_api = NinjaAPI(csrf=False)
ninja_api.add_router("user", user_router, auth=NOT_SET)
ninja_api.add_router("persons", person_router, auth=vran_auth)
ninja_api.add_router("tags", tag_router, auth=vran_auth)
ninja_api.add_router("contributions", contribution_router, auth=vran_auth)
ninja_api.add_router("merge_requests", router, auth=vran_auth)


class LoginRequest(Schema):
    # pylint: disable=too-few-public-methods
    "API model for login requests"
    name: str
    password: str


@ninja_api.post("login", auth=NOT_SET)
def login_post(request, credentials: LoginRequest):
    "API endpoint for login"
    user = authenticate(
        request, username=credentials.name, password=credentials.password
    )
    if user is None:
        return
    login(request, user)


urlpatterns = [path("manage/", admin.site.urls), path("api/", ninja_api.urls)]
