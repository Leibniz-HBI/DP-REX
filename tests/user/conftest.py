# pylint: disable=missing-module-docstring,missing-function-docstring,no-member,redefined-outer-name
import pytest

import tests.user.common as c
from vran.tag.models_django import TagDefinition, TagDefinitionHistory


@pytest.fixture
def tag_def_user_profile():
    return TagDefinitionHistory.objects.create(
        name=c.name_tag_def,
        id_persistent=c.id_tag_def_persistent,
        time_edit=c.time_edit_tag_def,
        type=TagDefinition.STRING,
    )


@pytest.fixture
def tag_def_user_profile1():
    return TagDefinitionHistory.objects.create(
        name=c.name_tag_def1,
        id_persistent=c.id_tag_def_persistent1,
        time_edit=c.time_edit_tag_def1,
        type=TagDefinition.STRING,
    )


@pytest.fixture
def tag_def_user_profile2():
    return TagDefinitionHistory.objects.create(
        name=c.name_tag_def2,
        id_persistent=c.id_tag_def_persistent2,
        time_edit=c.time_edit_tag_def2,
        type=TagDefinition.STRING,
    )


@pytest.fixture
def tag_def_user_profile3():
    return TagDefinitionHistory.objects.create(
        name=c.name_tag_def3,
        id_persistent=c.id_tag_def_persistent3,
        time_edit=c.time_edit_tag_def3,
        type=TagDefinition.STRING,
    )


@pytest.fixture
def user_with_tag_defs(
    user,
    tag_def_user_profile,
    tag_def_user_profile1,
    tag_def_user_profile2,
    tag_def_user_profile3,
):
    user.tag_definitions = [
        tag_def.id_persistent
        for tag_def in [
            tag_def_user_profile,
            tag_def_user_profile1,
            tag_def_user_profile2,
            tag_def_user_profile3,
        ]
    ]
    user.save()
    return user
