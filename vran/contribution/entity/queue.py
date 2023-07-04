"Queue methods for removing duplicates of a contribution candidate."
from django.db import transaction
from django.db.models import OuterRef, Subquery
from django.db.utils import OperationalError

from vran.contribution.entity.models_django import EntityDuplicate
from vran.contribution.models_django import ContributionCandidate
from vran.entity.models_django import Entity
from vran.tag.models_django import TagInstance
from vran.util import timestamp


def eliminate_duplicates(id_contribution_persistent):
    "Eliminate all marked duplicate entities for a contribution candidate"
    contribution_query = ContributionCandidate.objects.select_for_update().filter(  # pylint: disable=no-member
        id_persistent=id_contribution_persistent
    )
    try:
        with transaction.atomic():
            try:
                contribution = contribution_query.get()
            except OperationalError:
                return
        time_edit = timestamp()
        duplicates = EntityDuplicate.objects.filter(  # pylint: disable=no-member
            contribution_candidate=contribution
        )
        tag_instances_with_duplicates = annotate_with_replacement_info(
            TagInstance.most_recent_queryset(), duplicates, "id_entity_persistent"
        )
        update_tag_instances(tag_instances_with_duplicates, time_edit)

        replaced_entities_with_duplicates = annotate_with_replacement_info(
            Entity.objects.filter(  # pylint: disable=no-member
                contribution_candidate=contribution
            ),
            duplicates,
            "id_persistent",
        )
        update_entities(replaced_entities_with_duplicates)
    except (Exception,):  # pylint: disable=broad-except
        contribution_candidate = contribution_query.get()
        contribution_candidate.state = ContributionCandidate.VALUES_EXTRACTED
        contribution_candidate.save()


def update_tag_instances(tag_instances_with_duplicates, time_edit):
    "Update tag instances according to replacement info."
    # no good way to keep track of updates in bulk operation for now
    tag_instances_with_duplicates = tag_instances_with_duplicates.filter(
        replacement_id_entity_persistent__isnull=False
    )
    updated_tag_instances = [
        TagInstance.change_or_create(
            id_persistent=tag_instance.id_persistent,
            id_entity_persistent=tag_instance.replacement_id_entity_persistent,
            value=tag_instance.value,
            id_tag_definition_persistent=tag_instance.id_tag_definition_persistent,
            version=tag_instance.id,
            time_edit=time_edit,
        )[0]
        for tag_instance in tag_instances_with_duplicates
    ]
    TagInstance.objects.bulk_create(updated_tag_instances)  # pylint: disable=no-member


def annotate_with_replacement_info(manager, replacements, id_entity_field_name):
    "Annotate DB objects with replacement information."
    return manager.annotate(  # pylint: disable=no-member
        replacement_id_entity_persistent=Subquery(
            replacements.filter(
                id_origin_persistent=OuterRef(id_entity_field_name)
            ).values("id_destination_persistent")
        )
    )


def update_entities(entities_with_replacement_info):
    """Update entities according to replacement info:
    Replaced entities will be deleted and
    others will be made full entities by removing the contribution_candidate."""
    # In the future the entities may just be disabled.
    entities_with_replacement_info.filter(
        replacement_id_entity_persistent__isnull=False
    ).delete()
    entities_with_replacement_info.filter(
        replacement_id_entity_persistent__isnull=True
    ).update(contribution_candidate=None)
