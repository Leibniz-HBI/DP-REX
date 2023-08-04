# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from django.db import IntegrityError

from tests.entity import common as ce
from tests.user import common as cu
from tests.user.api.integration.requests import post_login, post_register
from vran.entity.models_django import Entity
from vran.util import VranUser


@pytest.fixture
def entity0():
    entity = Entity(
        id_persistent=ce.id_persistent_test_0,
        time_edit=ce.time_edit_test_0,
        display_txt=ce.display_txt_test0,
    )
    entity.save()
    return entity


@pytest.fixture()
def entity1():
    entity = Entity(
        id_persistent=ce.id_persistent_test_1,
        time_edit=ce.time_edit_test_1,
        display_txt=ce.display_txt_test1,
    )
    entity.save()
    return entity


@pytest.fixture
def entity1_changed(entity1):

    Entity.change_or_create(
        id_persistent=entity1.id_persistent,
        time_edit=ce.time_edit_test_1_changed,
        display_txt="edited_entity",
        version=entity1.id,
    )[0].save()


@pytest.fixture()
def entity2():
    entity = Entity(
        id_persistent=ce.id_persistent_test_2,
        time_edit=ce.time_edit_test_2,
        display_txt=ce.display_txt_test2,
    )
    entity.save()
    return entity


@pytest.fixture
def auth_server(live_server):
    uuidMock = MagicMock(return_value=UUID(cu.test_uuid))
    with patch("vran.user.api.uuid4", uuidMock):
        rsp = post_register(
            live_server.url,
            {
                "user_name": cu.test_username,
                "password": cu.test_password,
                "email": cu.test_email,
                "names_personal": cu.test_names_personal,
            },
        )
    rsp = post_login(
        live_server.url, {"name": cu.test_username, "password": cu.test_password}
    )
    return live_server, rsp.cookies


@pytest.fixture()
def auth_server1(auth_server):
    live_server, cookies_user0 = auth_server
    url = live_server.url
    uuidMock = MagicMock(return_value=UUID(cu.test_uuid1))
    with patch("vran.user.api.uuid4", uuidMock):
        rsp = post_register(
            url,
            {
                "user_name": cu.test_username1,
                "password": cu.test_password1,
                "email": cu.test_email1,
                "names_personal": cu.test_names_personal1,
            },
        )
    rsp = post_login(url, {"name": cu.test_username1, "password": cu.test_password1})
    return live_server, cookies_user0, rsp.cookies


@pytest.fixture
def user(db):  # pylint: disable=unused-argument
    try:
        user = VranUser.objects.create_user(
            username=cu.test_username,
            password=cu.test_password,
            email=cu.test_email,
            first_name=cu.test_names_personal,
            id_persistent=cu.test_uuid,
        )
        return user
    except IntegrityError:
        return VranUser.objects.get(email=cu.test_email)  # pylint: disable=no-member


@pytest.fixture
def user1(db):  # pylint: disable=unused-argument
    try:
        user = VranUser.objects.create_user(
            username=cu.test_username1,
            password=cu.test_password1,
            email=cu.test_email1,
            first_name=cu.test_names_personal1,
            id_persistent=cu.test_uuid1,
        )
        return user
    except IntegrityError:
        return VranUser.objects.get(email=cu.test_email1)  # pylint: disable=no-member
