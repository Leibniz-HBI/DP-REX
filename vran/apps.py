"""Django app configuration for VrAN"""
import logging
from typing import List

from django.apps import AppConfig, apps
from django.conf import settings
from django.core.exceptions import AppRegistryNotReady
from django.db.models.signals import post_migrate
from django.db.utils import DatabaseError, OperationalError, ProgrammingError

from vran.signals import (
    connect_add_superuser,
    connect_merge_request_queue_process,
    connect_read_csv_signal,
    connect_tag_definition_queue_process,
)

logger = logging.getLogger("vran.app_config")


added_permissions = {
    "VranGroup.APPLICANT": [],
    "VranGroup.READER": [],
    "VranGroup.CONTRIBUTOR": [],
    "VranGroup.EDITOR": [],
    "VranGroup.COMMISSIONER": [],
}


def add_permission_for_group(group: str, permission_list_list: List[List[str]]):
    "Method for granting permissions to groups."
    group_model = apps.get_model("auth", "Group")
    permission_model = apps.get_model("auth", "group_permissions")
    group_name = str(group)

    group, _created_group = group_model.objects.get_or_create(name=group_name)
    for permission_list in permission_list_list:
        for permission_name in permission_list:
            permission = permission_model.objects.filter(codename=permission_name).get()
            if not permission in group.permissions:
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


class VranConfig(AppConfig):
    """Configuration for the VrAN Django app"""

    default_auto_field = "django.db.models.BigAutoField"
    name = "vran"

    def ready(self) -> None:
        connect_add_superuser()
        post_migrate.connect(add_permissions, dispatch_uid="vran.create_groups")
        try:
            if not settings.IS_UNITTEST:
                connect_read_csv_signal()
                connect_merge_request_queue_process()
                populate_tag_definition_name_path_cache()
                connect_tag_definition_queue_process()
        except AppRegistryNotReady:
            pass
        super().ready()


def populate_tag_definition_name_path_cache():
    "Spawn queue processes that populate the name path cache for all"
    # pylint: disable=import-outside-toplevel
    from django_rq import enqueue

    from vran.tag.models_django import TagDefinition
    from vran.tag.queue import update_tag_definition_name_path

    try:
        roots = TagDefinition.most_recent_children(None)
        for root in roots:
            enqueue(update_tag_definition_name_path, root.id_persistent, [])
    except (OperationalError, DatabaseError, ProgrammingError):
        pass  #
