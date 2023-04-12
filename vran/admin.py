"""Django admin functionality."""
from django.contrib import admin  # pylint: disable=unused-import

# Register your models here.
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm

from vran.util import VranUser


class VranUserChangeForm(UserChangeForm):
    # pylint: disable=too-few-public-methods
    "Admin form for changing users"

    class Meta(UserChangeForm.Meta):
        # pylint: disable=too-few-public-methods
        "Meta class for admin user form."
        model = VranUser


class VranUserAdmin(UserAdmin):
    # pylint: disable=too-few-public-methods
    "Configure admin."
    form = VranUserChangeForm

    # fieldsets = UserAdmin.fieldsets + (
    #         (None, {'fields': ('some_extra_data',)}),
    # )


admin.site.register(VranUser, VranUserAdmin)
