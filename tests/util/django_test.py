# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name
from datetime import datetime

import pytest
from django.db import IntegrityError

from vran.entity.models_django import Entity
from vran.util import django as du


@pytest.mark.django_db
def test_store_multiple():
    entity_test_0 = Entity(
        id_persistent="test_id_0", display_txt="foo", time_edit=datetime(2022, 11, 14)
    )
    entity_test_1 = Entity(
        id_persistent="test_id_1", display_txt="foo", time_edit=datetime(2022, 11, 14)
    )
    entity_test_2 = Entity(
        id_persistent="test_id_2", display_txt="foo", time_edit=datetime(2022, 11, 14)
    )

    entities_test = [entity_test_0, entity_test_1, entity_test_2]
    du.save_many_atomic(entities_test)
    assert len(Entity.objects.all()) == 3  # pylint: disable=no-member


@pytest.mark.django_db
def test_does_rollback():

    entity_test_0 = Entity(
        id_persistent="test_id_0", display_txt="foo", time_edit=datetime(2022, 11, 14)
    )
    entity_test_1 = Entity(
        id_persistent="test_id_1",
        display_txt="foo",
        time_edit=datetime(2022, 11, 14),
        previous_version=entity_test_0,
    )
    entity_test_2 = Entity(
        id_persistent="test_id_2",
        display_txt="foo",
        time_edit=datetime(2022, 11, 14),
        previous_version=entity_test_0,
    )

    entities_test = [entity_test_0, entity_test_1, entity_test_2]

    with pytest.raises(IntegrityError):
        du.save_many_atomic(entities_test)
    assert len(Entity.objects.all()) == 0  # pylint: disable=no-member
