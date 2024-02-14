# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name,unused-argument,protected-access
from datetime import timedelta

import pytest

from tests.tag import common as c
from vran.exception import (
    InvalidTagValueException,
    NoParentTagException,
    TagDefinitionExistsException,
)
from vran.tag.models_django import TagDefinition, TagDefinitionHistory
from vran.util import timestamp


@pytest.mark.django_db
def test_different_name(tag_def_history):
    tag_def1 = TagDefinitionHistory(
        id_persistent=tag_def_history.id_persistent,
        time_edit=tag_def_history.time_edit,
        name="changed tag name",
        type=tag_def_history.type,
    )
    assert tag_def_history.check_different_before_save(tag_def1)
    assert tag_def1.check_different_before_save(tag_def_history)


@pytest.mark.django_db
def test_different_id_parent(tag_def_history):
    tag_def1 = TagDefinitionHistory(
        id_persistent=tag_def_history.id_persistent,
        time_edit=tag_def_history.time_edit,
        id_parent_persistent=c.id_tag_def_parent_persistent_test,
        name=c.name_tag_def_test,
        type=tag_def_history.type,
    )
    assert tag_def_history.check_different_before_save(tag_def1)
    assert tag_def1.check_different_before_save(tag_def_history)


@pytest.mark.django_db
def test_different_type(tag_def_history):
    tag_def1 = TagDefinitionHistory(
        id_persistent=tag_def_history.id_persistent,
        time_edit=tag_def_history.time_edit,
        name=c.name_tag_def_test,
        type=TagDefinition.INNER,
    )
    assert tag_def_history.check_different_before_save(tag_def1)
    assert tag_def1.check_different_before_save(tag_def_history)


@pytest.mark.django_db
def test_same(tag_def_history):
    tag_def1 = TagDefinitionHistory(
        id_persistent=tag_def_history.id_persistent,
        time_edit=tag_def_history.time_edit,
        name=c.name_tag_def_test,
        type=TagDefinition.FLOAT,
    )
    assert not tag_def_history.check_different_before_save(tag_def1)
    assert not tag_def1.check_different_before_save(tag_def_history)


@pytest.mark.django_db
def test_store_and_retrieve_tag_def(tag_def_history):
    tag_def_history.save()
    retrieved = TagDefinition.objects.get(  # pylint: disable=no-member
        name=c.name_tag_def_test
    )
    assert retrieved.id == tag_def_history.id
    assert not tag_def_history.check_different_before_save(retrieved)


@pytest.mark.django_db
def test_missing_parent():
    with pytest.raises(NoParentTagException) as exc:
        TagDefinitionHistory.change_or_create(
            c.id_tag_def_persistent_test,
            c.time_edit_test,
            c.name_tag_def_test,
            c.id_tag_def_parent_persistent_test,
        )
    assert exc.value.args[0] == c.id_tag_def_parent_persistent_test


@pytest.mark.django_db
def test_valid_parent_same_name(tag_def_history):
    tag_def_history.id_persistent = c.id_tag_def_parent_persistent_test
    tag_def_history.type = TagDefinition.INNER
    tag_def_history.save()
    ret, _ = TagDefinitionHistory.change_or_create(
        c.id_tag_def_persistent_test,
        c.time_edit_test,
        c.name_tag_def_test,
        c.id_tag_def_parent_persistent_test,
    )
    assert ret.id_parent_persistent == c.id_tag_def_parent_persistent_test


@pytest.mark.django_db
def test_tag_exists_root(tag_def):

    with pytest.raises(TagDefinitionExistsException) as exc:
        TagDefinitionHistory.change_or_create(
            None,
            c.time_edit_test,
            c.name_tag_def_test,
            None,
        )
    assert exc.value.args[0] == c.name_tag_def_test
    assert exc.value.args[1] == c.id_tag_def_persistent_test
    assert exc.value.args[2] is None


@pytest.mark.django_db
def test_tag_exists_child(tag_def_parent):
    old, _ = TagDefinitionHistory.change_or_create(
        c.id_tag_def_persistent_test,
        c.time_edit_test,
        c.name_tag_def_test,
        c.id_tag_def_parent_persistent_test,
    )
    old.save()

    with pytest.raises(TagDefinitionExistsException) as exc:
        TagDefinitionHistory.change_or_create(
            "other_tag_def_id_test",
            c.time_edit_test,
            c.name_tag_def_test,
            c.id_tag_def_parent_persistent_test,
        )
    assert exc.value.args[0] == c.name_tag_def_test
    assert exc.value.args[1] == c.id_tag_def_persistent_test
    assert exc.value.args[2] == c.id_tag_def_parent_persistent_test


@pytest.mark.django_db
def test_tag_exists_rename(tag_def, tag_def_user):
    with pytest.raises(TagDefinitionExistsException) as exc:
        TagDefinitionHistory.change_or_create(
            c.id_tag_def_persistent_test,
            c.time_edit_test,
            c.name_tag_def_test_user,
            None,
        )

    assert exc.value.args[0] == c.name_tag_def_test_user
    assert exc.value.args[1] == c.id_tag_def_persistent_test_user
    assert exc.value.args[2] is None


@pytest.mark.django_db
def test_float_check_valid(tag_def):
    tag_def.check_value(2.0)


@pytest.mark.django_db
def test_float_check_invalid(tag_def):
    with pytest.raises(InvalidTagValueException) as exc:
        tag_def.check_value("a")
    assert exc.value.args[0] == tag_def.id_persistent
    assert exc.value.args[1] == "a"
    assert exc.value.args[2] == "FLT"


@pytest.mark.django_db
def test_string_check_valid(tag_def):
    tag_def.type = TagDefinition.STRING
    tag_def.check_value("foo")


@pytest.mark.django_db
def test_string_check_invalid(tag_def):
    tag_def.type = TagDefinition.STRING
    with pytest.raises(InvalidTagValueException) as exc:
        tag_def.check_value(None)
    assert exc.value.args[0] == tag_def.id_persistent
    assert exc.value.args[1] is None
    assert exc.value.args[2] == "STR"


@pytest.mark.django_db
def test_inner_check_true_valid(tag_def):
    tag_def.type = TagDefinition.INNER
    tag_def.check_value("true")


@pytest.mark.django_db
def test_inner_check_false_valid(tag_def):
    tag_def.type = TagDefinition.INNER
    tag_def.check_value("false")


@pytest.mark.django_db
def test_inner_check_invalid(tag_def):
    tag_def.type = TagDefinition.INNER
    with pytest.raises(InvalidTagValueException) as exc:
        tag_def.check_value(True)
    assert exc.value.args[0] == tag_def.id_persistent
    assert exc.value.args[1]
    assert exc.value.args[2] == "INR"


@pytest.mark.django_db
def test_childrens(tag_def_parent, tag_def_child_0, tag_def_child_1):
    ret = TagDefinition.most_recent_children(c.id_tag_def_parent_persistent_test)
    assert set(ret) == {tag_def_child_0, tag_def_child_1}


@pytest.mark.django_db
def test_children_updated(tag_def_parent, tag_def_child_0, tag_def_child_1):
    tag_def_child_0_updated_history, _ = TagDefinitionHistory.change_or_create(
        id_persistent=tag_def_child_0.id_persistent,
        type=TagDefinition.FLOAT,
        id_parent_persistent=c.id_tag_def_parent_persistent_test,
        name=tag_def_child_0.name + "modified",
        time_edit=tag_def_child_0.time_edit + timedelta(seconds=10),
        version=tag_def_child_0.id,
    )
    tag_def_child_0_updated_history.save()
    tag_def_child_0_updated = TagDefinition.objects.get(  # pylint: disable=no-member
        id=tag_def_child_0_updated_history.id
    )
    ret = TagDefinition.most_recent_children(c.id_tag_def_parent_persistent_test)
    assert set(ret) == {tag_def_child_1, tag_def_child_0_updated}


@pytest.mark.django_db
def test_children_empty(tag_def_parent):
    ret = TagDefinition.most_recent_children(c.id_tag_def_parent_persistent_test)
    assert not ret


@pytest.mark.django_db
def test_children_root(tag_def):
    ret = TagDefinition.most_recent_children(None)
    assert ret == [tag_def]


@pytest.mark.django_db
def test_only_for_user(tag_def_user, tag_def):
    ret = TagDefinition.for_user(tag_def_user.owner).get()
    assert ret == tag_def_user


@pytest.mark.django_db
def test_most_recent_for_user(tag_def_user):
    tag_def_edited, _ = TagDefinitionHistory.change_or_create(
        id_persistent=tag_def_user.id_persistent,
        id_parent_persistent=None,
        time_edit=timestamp(),
        name="new_name",
        owner=tag_def_user.owner,
        version=tag_def_user.id,
    )
    tag_def_edited.save()
    ret = TagDefinition.for_user(tag_def_user.owner).get()
    assert ret._get_history_entry() == tag_def_edited


@pytest.mark.django_db
def test_can_create_hidden():
    tag_def, _ = TagDefinitionHistory.change_or_create(
        id_persistent=c.id_tag_def_persistent_test,
        id_parent_persistent=None,
        time_edit=timestamp(),
        name="new_name",
        owner=None,
        hidden=True,
    )
    tag_def.save()
    retrieved = TagDefinition.most_recent_by_id(c.id_tag_def_persistent_test)
    assert retrieved.hidden
