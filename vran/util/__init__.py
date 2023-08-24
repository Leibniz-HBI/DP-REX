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
    tag_definitions = models.JSONField(default=[])
    APPLICANT = "APLC"
    READER = "READ"
    CONTRIBUTOR = "CNTR"
    EDITOR = "EDTR"
    COMMISSIONER = "COMM"
    PERMISSION_GROUP_CHOICES = [
        (APPLICANT, "applicant"),
        (READER, "reader"),
        (CONTRIBUTOR, "contributor"),
        (EDITOR, "editor"),
        (COMMISSIONER, "commissioner"),
    ]
    permission_group = models.TextField(
        choices=PERMISSION_GROUP_CHOICES, default=APPLICANT, max_length=4
    )

    @classmethod
    def chunk_query_set(cls, offset, count, include_superuser=False):
        """Get a chunk of users. They need to have an id large than offset.
        The maximum number of elements return is count."""
        filtered_by_id = cls.objects.filter(id__gte=offset)
        if not include_superuser:
            filtered_by_id = filtered_by_id.exclude(is_superuser=True)
        return filtered_by_id.order_by(models.F("id").asc())[:count]

    def append_tag_definition_by_id(self, id_tag_definition_persistent):
        """Adds the persistent id of a tag definition to the end of
        the list containing the persistent tag definition ids for the user"""
        tag_definitions = self.tag_definitions
        tag_definitions.append(id_tag_definition_persistent)

    def remove_tag_definition_by_id(self, id_tag_definition_persistent):
        """Removes a persistent id of a tag definition from
        the list containing the persistent tag definition ids for the user"""
        old_tag_definitions = self.tag_definitions
        new_tag_definitions = [
            id_tag_def_old
            for id_tag_def_old in old_tag_definitions
            if id_tag_def_old != id_tag_definition_persistent
        ]
        self.tag_definitions = new_tag_definitions
        self.save()

    def swap_tag_definition_idx(self, start_idx, end_idx):
        """Switches two positions in the list containing
        the persistent tag definition ids for the user"""
        tag_definitions = self.tag_definitions
        at_start = tag_definitions[start_idx]
        tag_definitions[start_idx] = tag_definitions[end_idx]
        tag_definitions[end_idx] = at_start


def timestamp():
    "Create a timezone aware timestamp"
    return datetime.now(timezone.utc)
