# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name,unused-argument,too-many-locals,too-many-arguments,too-many-statements
from unittest.mock import MagicMock, patch

from tests.merge_request.entity import common as c
from tests.merge_request.entity.api.integration import requests as req
from tests.user import common as cu
from tests.utils import assert_versioned
from vran.exception import NotAuthenticatedException


def test_unknown_user(auth_server_commissioner):
    mock = MagicMock()
    mock.side_effect = NotAuthenticatedException()
    server, cookies = auth_server_commissioner
    with patch("vran.merge_request.entity.api.check_user", mock):
        rsp = req.get_merge_request(
            server.url,
            c.id_merge_request_persistent,
            cookies=cookies,
        )
        assert rsp.status_code == 401


def test_no_cookies(auth_server_commissioner):
    server, _ = auth_server_commissioner
    rsp = req.get_merge_request(
        server.url,
        c.id_merge_request_persistent,
    )
    assert rsp.status_code == 401


def test_normal_user(auth_server):
    server, cookies = auth_server
    rsp = req.get_merge_request(
        server.url,
        c.id_merge_request_persistent,
        cookies=cookies,
    )
    assert rsp.status_code == 403


def test_get_entity_merge_request(auth_server_commissioner, merge_request_user):
    server, cookies = auth_server_commissioner
    uuidMock = MagicMock()
    uuidMock.return_value = c.id_merge_request_persistent
    rsp = req.get_merge_request(
        server.url,
        merge_request_user.id_persistent,
        cookies=cookies,
    )
    assert rsp.status_code == 200
    json = rsp.json()
    assert_versioned(
        json,
        {
            "id_persistent": c.id_merge_request_persistent,
            "origin": {
                "display_txt": c.display_txt_entity_origin,
                "display_txt_details": "display_txt",
                "id_persistent": c.id_entity_origin_persistent,
                "disabled": False,
            },
            "destination": {
                "id_persistent": c.id_entity_destination_persistent,
                "display_txt": c.display_txt_entity_destination,
                "display_txt_details": "display_txt",
                "disabled": False,
            },
            "created_by": {
                "id_persistent": cu.test_uuid_commissioner,
                "user_name": cu.test_username_commissioner,
                "permission_group": "COMMISSIONER",
            },
            "state": "OPEN",
        },
    )
