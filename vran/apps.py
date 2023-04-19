"""Django app configuration for VrAN"""
import logging
from typing import List

from django.apps import AppConfig, apps
from django.db.backends.signals import connection_created
from django.db.models.signals import post_migrate

logger = logging.getLogger("vran.app_config")

READ_PERMISSIONS = [
    "view_person",
    "view_entity",
    "view_taginstance",
    "view_tagdefinition",
]

WRITE_PERMISSIONS = [
    "add_person",
    "add_entity",
    "add_taginstance",
    "add_tagdefinition",
]

added_permissions = {
    "VranGroup.APPLICANT": [],
    "VranGroup.READER": [READ_PERMISSIONS],
    "VranGroup.CONTRIBUTOR": [READ_PERMISSIONS],
    "VranGroup.EDITOR": [READ_PERMISSIONS, WRITE_PERMISSIONS],
    "VranGroup.COMMISSIONER": [READ_PERMISSIONS, WRITE_PERMISSIONS],
}


def add_permission_for_group(group: str, permission_list_list: List[List[str]]):
    "Method for granting permissions to groups."
    group_model = apps.get_model("auth", "Group")
    permission_model = apps.get_model("auth", "Permission")
    group_name = str(group)

    group, _created_group = group_model.objects.get_or_create(name=group_name)
    for permission_list in permission_list_list:
        for permission_name in permission_list:
            permission = permission_model.objects.get(codename=permission_name)
            group.permissions.add(permission)
    group.save()


def add_permissions(
    app_config: AppConfig, verbosity=2, **kwargs
):  # pylint: disable=unused-argument
    "Create all new groups and permissions."
    logger.setLevel(10 * (4 - verbosity))
    logger.info("Create VrAN groups.")
    permission_model = apps.get_model("auth", "Permission")
    for group, permissions in added_permissions.items():
        try:
            add_permission_for_group(group, permissions)
        except permission_model.DoesNotExist:
            logger.warning("Permissions do not exist yet.")
            return


def add_superuser(
    sender, connection, verbosity=2, **kwargs
):  # pylint: disable=unused-argument
    "Add superuser if no users exist"
    try:
        user_model = apps.get_model("vran", "vranuser")
        if user_model.objects.count() == 0:
            username = "admin"
            email = "mail@test.url"
            password = "changeme"
            print(f"Creating account for {username} ({email})")
            admin = user_model.objects.create_superuser(
                email=email, username=username, password=password
            )
            admin.is_active = True
            admin.is_admin = True
            admin.save()
    except Exception:  # pylint: disable=broad-except
        pass


class VranConfig(AppConfig):
    """Configuration for the VrAN Django app"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "vran"

    def ready(self) -> None:
        post_migrate.connect(add_permissions, dispatch_uid="vran.create_groups")
        connection_created.connect(
            add_superuser, dispatch_uid="vran.create_initial_superuser"
        )
        super().ready()
