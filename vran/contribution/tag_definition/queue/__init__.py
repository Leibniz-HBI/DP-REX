"Dispatch of queue functions for contribution candidates."

import django_rq

from vran.contribution.entity.queue import eliminate_duplicates
from vran.contribution.models_django import ContributionCandidate
from vran.contribution.tag_definition.queue.create import read_csv_head
from vran.contribution.tag_definition.queue.ingest import ingest_values_from_csv


def dispatch_read_csv_head(
    sender,
    instance,
    created,
    update_fields,
    **kwargs  # pylint: disable=unused-argument
):
    "Queues the task for extracting tags from columns."
    if created or (
        update_fields
        and "has_header" in update_fields
        and instance.state == ContributionCandidate.UPLOADED
    ):
        django_rq.enqueue(read_csv_head, str(instance.id_persistent))
        return
    if not (update_fields and "state" in update_fields):
        return
    if instance.state == ContributionCandidate.COLUMNS_ASSIGNED:
        django_rq.enqueue(ingest_values_from_csv, str(instance.id_persistent))
    elif instance.state == ContributionCandidate.ENTITIES_ASSIGNED:
        django_rq.enqueue(eliminate_duplicates, str(instance.id_persistent))
