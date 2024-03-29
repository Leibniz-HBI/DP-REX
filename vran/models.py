"""Union of all DB models."""
# pylint: disable=unused-import
from vran.contribution.entity.models_django import EntityDuplicate
from vran.contribution.models_django import ContributionCandidate
from vran.contribution.tag_definition.models_django import (
    TagDefinitionContribution,
    TagInstanceContribution,
)
from vran.entity.models_django import Entity
from vran.management.models_django import ConfigValue
from vran.merge_request.entity.models_django import (
    EntityConflictResolution,
    EntityMergeRequest,
)
from vran.merge_request.models_django import TagConflictResolution, TagMergeRequest
from vran.tag.models_django import TagDefinition, TagInstance
from vran.util import VranUser
