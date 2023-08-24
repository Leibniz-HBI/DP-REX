# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name
from unittest.mock import MagicMock, patch
from uuid import uuid4

from django.db import DatabaseError

import tests.user.common as c
from tests.user.api.integration.requests import post_register


def test_same_name(auth_server):
    live_server, _ = auth_server
    rsp = post_register(
        live_server.url,
        {
            "user_name": c.test_username,
            "email": "other@test.org",
            "names_personal": c.test_names_personal,
            "password": c.test_password,
        },
    )
    assert rsp.status_code == 400
    assert rsp.json() == {"msg": "Username or mail address already in use."}


def test_same_email(auth_server):
    live_server, _ = auth_server
    rsp = post_register(
        live_server.url,
        {
            "user_name": "other",
            "email": c.test_email,
            "names_personal": c.test_names_personal,
            "password": c.test_password,
        },
    )
    assert rsp.status_code == 400
    assert rsp.json() == {"msg": "Username or mail address already in use."}


def test_same_names(auth_server):
    live_server, _ = auth_server
    uuid = uuid4()
    uuidMock = MagicMock(return_value=uuid)
    with patch("vran.user.api.uuid4", uuidMock):
        rsp = post_register(
            live_server.url,
            {
                "user_name": "other",
                "email": "other@test.org",
                "names_personal": c.test_names_personal,
                "password": c.test_password,
            },
        )
    assert rsp.status_code == 200
    assert rsp.json() == {
        "user_name": "other",
        "email": "other@test.org",
        "names_personal": c.test_names_personal,
        "names_family": "",
        "tag_definition_list": [],
        "id_persistent": str(uuid),
        "permission_group": "APPLICANT",
    }


def test_bad_db(auth_server):
    live_server, _ = auth_server
    mock = MagicMock()
    mock.side_effect = DatabaseError("test")
    with patch("vran.util.VranUser.save", mock):
        req = post_register(
            live_server.url,
            {
                "user_name": "other",
                "email": "other@test.org",
                "names_personal": c.test_names_personal,
                "password": c.test_password,
            },
        )
    assert req.status_code == 500
    assert req.json() == {"msg": "Could not create user."}
