# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name,unused-argument
from unittest.mock import MagicMock, patch

import tests.management.display_txt.api.integration.requests as req
import tests.tag.common as ct
from vran.exception import NotAuthenticatedException
from vran.management.display_txt.api import DISPLAY_TXT_ORDER_CONFIG_KEY
from vran.management.models_django import ConfigValue


def test_no_cookies(auth_server):
    server, _ = auth_server
    rsp = req.post_append_tag_definition(server.url, "some-id")
    assert rsp.status_code == 401


def test_not_authenticated(auth_server):
    server, cookies = auth_server
    mock = MagicMock()
    mock.side_effect = NotAuthenticatedException()
    with patch("vran.management.display_txt.api.check_user", mock):
        rsp = req.post_append_tag_definition(server.url, "some-id", cookies=cookies)
    assert rsp.status_code == 401


def test_insufficient_permissions(auth_server):
    server, cookies = auth_server
    rsp = req.post_append_tag_definition(server.url, "some-id", cookies=cookies)
    assert rsp.status_code == 403


def test_unknown_tag_def(auth_server_commissioner):
    server, cookies = auth_server_commissioner
    rsp = req.post_append_tag_definition(server.url, "some-id", cookies=cookies)
    assert rsp.status_code == 404


def test_append_not_curated_config(auth_server_commissioner, tag_def):
    server, cookies = auth_server_commissioner
    rsp = req.post_append_tag_definition(
        server.url, tag_def.id_persistent, cookies=cookies
    )
    assert rsp.status_code == 400


def test_append_already_present(auth_server_commissioner, tag_def_curated):
    server, cookies = auth_server_commissioner
    rsp = req.post_append_tag_definition(
        server.url, tag_def_curated.id_persistent, cookies=cookies
    )
    assert rsp.status_code == 200
    rsp = req.post_append_tag_definition(
        server.url, tag_def_curated.id_persistent, cookies=cookies
    )
    assert rsp.status_code == 400


def test_append_to_nonexisting_config(auth_server_commissioner, tag_def_curated):
    server, cookies = auth_server_commissioner
    rsp = req.post_append_tag_definition(
        server.url, tag_def_curated.id_persistent, cookies=cookies
    )
    assert rsp.status_code == 200


def test_append_to_existing(
    auth_server_commissioner, tag_def_curated, display_txt_order_0
):
    server, cookies = auth_server_commissioner
    rsp = req.post_append_tag_definition(
        server.url, tag_def_curated.id_persistent, cookies=cookies
    )
    assert rsp.status_code == 200
    assert ConfigValue.get(DISPLAY_TXT_ORDER_CONFIG_KEY) == [
        ct.id_tag_persistent_test,
        ct.id_tag_def_curated_test,
    ]
