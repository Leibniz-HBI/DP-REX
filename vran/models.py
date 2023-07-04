"""Union of all DB models."""
# pylint: disable=unused-import
from vran.contribution.entity.models_django import EntityDuplicate
from vran.contribution.models_django import ContributionCandidate
from vran.contribution.tag_definition.models_django import (
    TagDefinitionContribution,
    TagInstanceContribution,
)
from vran.entity.models_django import Entity
from vran.merge_request.models_django import MergeRequest
from vran.tag.models_django import TagDefinition, TagInstance
from vran.util import VranUser
