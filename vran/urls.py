"""Registry for VrAN urls."""
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from vran.person.api import router as person_router

ninja_api = NinjaAPI()
ninja_api.add_router("persons", person_router)

urlpatterns = [path("manage/", admin.site.urls), path("api/", ninja_api.urls)]
