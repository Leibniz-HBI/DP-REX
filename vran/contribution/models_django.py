"Models for contribution proposals."
from traceback import TracebackException

from django.db import models, transaction
from django.db.models import Count, Subquery
from django.db.utils import OperationalError

from vran.contribution.tag_definition.models_django import TagDefinitionContribution
from vran.entity.models_django import Entity
from vran.exception import ResourceLockedException
from vran.tag.models_django import TagDefinition
from vran.util import VranUser
from vran.util.django import patch_from_dict


class ContributionCandidate(models.Model):
    "ORM Model for maintaining proposed contributions."
    UPLOADED = "UPLD"
    COLUMNS_EXTRACTED = "CLXT"
    COLUMNS_ASSIGNED = "CLAS"
    VALUES_EXTRACTED = "VLXT"
    ENTITIES_MATCHED = "NTMT"
    ENTITIES_ASSIGNED = "NTAS"
    VALUES_ASSIGNED = "VLAS"
    MERGED = "MRGD"
    TYPE_CHOICES = [
        (UPLOADED, "uploaded"),
        (COLUMNS_EXTRACTED, "columns extracted"),
        (COLUMNS_ASSIGNED, "columns assigned"),
        (VALUES_EXTRACTED, "values extracted"),
        (ENTITIES_MATCHED, "entities matched"),
        (ENTITIES_ASSIGNED, "entities assigned"),
        (VALUES_ASSIGNED, "values assigned"),
        (MERGED, "merged"),
    ]

    name = models.TextField()
    description = models.TextField()
    id_persistent = models.UUIDField(primary_key=True)
    anonymous = models.BooleanField()
    has_header = models.BooleanField()
    created_by = models.ForeignKey("VranUser", on_delete=models.CASCADE)
    file_name = models.TextField()
    state = models.CharField(max_length=4, choices=TYPE_CHOICES)
    error_msg = models.TextField(blank=True, null=True)
    error_trace = models.TextField(blank=True, null=True)

    def set_state(self, state, error_msg=None, exception=None):
        "Set state of the contribution and set or reset a possible error message."
        self.state = state
        self.error_msg = error_msg
        if exception is not None:
            self.error_trace = list(
                TracebackException.from_exception(exception).format()
            )[-1].strip()
        else:
            self.error_trace = None

    @classmethod
    def chunk_for_user(cls, user, start, offset):
        "Get the contribution candidates for a specific user."
        return ContributionCandidate.objects.filter(  # pylint: disable=no-member
            created_by=user
        ).all()[start : start + offset]

    @classmethod
    def by_id_persistent(cls, id_persistent: str, user: VranUser):
        "Get a single contribution candidate"
        return ContributionCandidate.objects.filter(  # pylint: disable=no-member
            created_by=user, id_persistent=id_persistent
        )

    @classmethod
    def update(cls, id_persistent: str, user: VranUser, **kwargs):
        "Changes a contribution candidate."
        try:
            with transaction.atomic():
                candidate_query = ContributionCandidate.by_id_persistent(
                    id_persistent, user
                )
                candidate = candidate_query.select_for_update(nowait=True).get()
                patch_from_dict(candidate, **kwargs)
            return candidate
        except OperationalError as exc:
            if str(exc.args[0]).startswith("database is locked"):
                raise ResourceLockedException() from exc
            raise exc

    class InvalidTagAssignmentException(Exception):
        "Indicates that invalid tag assignments where found when trying to complete the assignment."

        def __init__(self, invalid_column_names_list):
            super().__init__()
            self.invalid_column_names_list = invalid_column_names_list

    class MissingRequiredAssignmentsException(Exception):
        "Exception indicating that a set of column assignment misses required tag assignment"

        def __init__(self, required_fields) -> None:
            super().__init__()
            self.required_fields = required_fields

    class DuplicateAssignmentException(Exception):
        "Exception indicating that more than one column is assigned to the same existing tag."

        def __init__(self, duplicate_assignments_list) -> None:
            super().__init__()
            self.duplicate_assignments_list = duplicate_assignments_list

    def complete_tag_assignment(self):
        "Lock a tag assignment for the contribution candidate."
        self.check_assignment_validity()
        self.set_state(ContributionCandidate.COLUMNS_ASSIGNED)
        self.save(update_fields=["state"])

    def complete_entity_assignment(self):
        "Complete entity assignment for the candidate."
        self.set_state(ContributionCandidate.ENTITIES_ASSIGNED)
        self.save(update_fields=["state"])

    def check_assignment_validity(self):
        "Check the validity of the column assignment for the contribution candidate."
        active = TagDefinitionContribution.objects.filter(  # pylint: disable=no-member
            contribution_candidate=self, discard=False
        )
        required_fields = ["display_txt"]  # , "id_persistent"]
        with_required_fields = active.filter(id_existing_persistent__in=required_fields)
        if len(with_required_fields) == 0:
            raise self.MissingRequiredAssignmentsException(required_fields)
        invalid = active.exclude(
            id_existing_persistent__in=Subquery(
                TagDefinition.objects.values(  # pylint: disable=no-member
                    "id_persistent"
                )
            )
        ).exclude(id_existing_persistent__in=required_fields)
        if len(invalid) > 0:
            raise self.InvalidTagAssignmentException(
                invalid.values_list("name", flat=True)
            )
        duplicate_assignments = (
            active.values("id_existing_persistent")
            .annotate(count=Count("id_existing_persistent"))
            .values("id_existing_persistent")
            .exclude(count=1)
        )
        if len(duplicate_assignments) > 0:
            duplicate_names = active.filter(
                id_existing_persistent__in=duplicate_assignments
            ).values_list("name", flat=True)
            raise self.DuplicateAssignmentException(duplicate_names)

    def get_entities_chunked(self, start, offset):
        "Get entities in chunks"
        return Entity.get_most_recent_chunked(
            start,
            offset,
            Entity.objects.filter(  # pylint: disable=no-member
                contribution_candidate=self
            ),
        )
