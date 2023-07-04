"Django models for merge requests."
from django.db import models

from vran.util import VranUser


class MergeRequest(models.Model):
    "Django model for a merge request."
    id_destination_persistent = models.TextField()
    id_origin_persistent = models.TextField()
    created_by = models.ForeignKey(
        "VranUser", related_name="created_merge_requests", on_delete=models.CASCADE
    )
    assigned_to = models.ForeignKey(
        "VranUser",
        related_name="assigned_merge_requests",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField()
    id_persistent = models.UUIDField(primary_key=True)
    contribution_candidate = models.ForeignKey(
        "ContributionCandidate", on_delete=models.CASCADE
    )

    @classmethod
    def created_by_user(cls, user: VranUser):
        "Get all merge requests created by a user"
        return MergeRequest.objects.filter(created_by=user)  # pylint: disable=no-member

    @classmethod
    def assigned_to_user(cls, user: VranUser):
        "Get all merge requests assigned to a user"
        return MergeRequest.objects.filter(  # pylint: disable=no-member
            assigned_to=user
        )
