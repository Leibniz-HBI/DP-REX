# pylint: disable=missing-module-docstring,redefined-outer-name,invalid-name,unused-argument,too-many-locals,too-many-arguments,too-many-statements
from unittest.mock import MagicMock, patch

import tests.tag.api.integration.requests as req
import tests.tag.common as c
import tests.user.common as cu
from tests.utils import assert_versioned
from vran.exception import NotAuthenticatedException


def test_unknown_user(auth_server):
    "Make sure that an unauthenticated user gets the correct status code."
    mock = MagicMock()
    mock.side_effect = NotAuthenticatedException()
    server, cookies = auth_server
    with patch("vran.tag.api.permissions.check_user", mock):
        rsp = req.get_ownership_requests(server.url, cookies)
    assert rsp.status_code == 401


def test_no_cookies(auth_server):
    "Make sure that without cookies the response has a unauthenticated status."
    server, _ = auth_server
    rsp = req.get_ownership_requests(server.url)
    assert rsp.status_code == 401


def test_get_request(auth_server, ownership_request_curated, ownership_request_user):
    "Make sure that permission requests are returned from api."
    server, cookies = auth_server
    rsp = req.get_ownership_requests(server.url, cookies)
    assert rsp.status_code == 200
    json = rsp.json()
    assert_versioned(
        json,
        {
            "received": [
                {
                    "petitioner": {
                        "user_name": cu.test_username_commissioner,
                        "id_persistent": cu.test_uuid_commissioner,
                        "permission_group": "COMMISSIONER",
                    },
                    "receiver": {
                        "user_name": cu.test_username,
                        "id_persistent": cu.test_uuid,
                        "permission_group": "APPLICANT",
                    },
                    "tag_definition": {
                        "id_persistent": c.id_tag_def_curated_test,
                        "name": c.name_tag_def_curated_test,
                        "type": "INNER",
                        "curated": True,
                        "id_parent_persistent": None,
                        "name_path": [c.name_tag_def_curated_test],
                        "owner": None,
                    },
                    "id_persistent": c.id_ownership_request_curated_test,
                }
            ],
            "petitioned": [
                {
                    "petitioner": {
                        "user_name": cu.test_username,
                        "id_persistent": cu.test_uuid,
                        "permission_group": "APPLICANT",
                    },
                    "receiver": {
                        "user_name": cu.test_username1,
                        "id_persistent": cu.test_uuid1,
                        "permission_group": "APPLICANT",
                    },
                    "tag_definition": {
                        "id_persistent": c.id_tag_def_persistent_test_user,
                        "name": c.name_tag_def_test,
                        "type": "FLOAT",
                        "curated": False,
                        "id_parent_persistent": None,
                        "name_path": [c.name_tag_def_test],
                        "owner": cu.test_username,
                    },
                    "id_persistent": c.id_ownership_request_test,
                }
            ],
        },
    )


def test_get_request_commissioner(
    auth_server_commissioner, ownership_request_curated_editor
):
    """Make sure that permission requests are returned from api
    for commissioners, when there are curated tags involved."""
    server, cookies = auth_server_commissioner
    rsp = req.get_ownership_requests(server.url, cookies)
    assert rsp.status_code == 200
    json = rsp.json()
    assert_versioned(
        json,
        {
            "received": [],
            "petitioned": [
                {
                    "petitioner": {
                        "user_name": cu.test_username_editor,
                        "id_persistent": cu.test_uuid_editor,
                        "permission_group": "EDITOR",
                    },
                    "receiver": {
                        "user_name": cu.test_username,
                        "id_persistent": cu.test_uuid,
                        "permission_group": "APPLICANT",
                    },
                    "tag_definition": {
                        "id_persistent": c.id_tag_def_curated_test,
                        "name": c.name_tag_def_curated_test,
                        "type": "INNER",
                        "curated": True,
                        "id_parent_persistent": None,
                        "name_path": [c.name_tag_def_curated_test],
                        "owner": None,
                    },
                    "id_persistent": c.id_ownership_request_curated_test,
                }
            ],
        },
    )
