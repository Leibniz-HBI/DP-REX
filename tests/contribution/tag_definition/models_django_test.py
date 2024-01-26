# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name, unused-argument
from vran.contribution.tag_definition.models_django import TagDefinitionContribution


def test_ignore_users(contribution_tag_def, contribution_tag_def_other):
    assert list(
        TagDefinitionContribution.get_by_candidate_query_set(
            contribution_tag_def.contribution_candidate
        )
    ) == [contribution_tag_def]


def test_empty(contribution_user):
    assert not TagDefinitionContribution.get_by_candidate_query_set(contribution_user)
