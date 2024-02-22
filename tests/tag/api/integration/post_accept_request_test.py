# pylint: disable=missing-module-docstring,redefined-outer-name,invalid-name,unused-argument,too-many-locals,too-many-arguments,too-many-statements
from unittest.mock import MagicMock, patch

import tests.tag.api.integration.requests as req
import tests.tag.common as c
from vran.exception import NotAuthenticatedException
from vran.merge_request.models_django import TagMergeRequest
from vran.tag.models_django import TagDefinition


def test_unknown_user(auth_server):
    "Make sure that an unauthenticated user gets the correct status code."
    mock = MagicMock()
    mock.side_effect = NotAuthenticatedException()
    server, cookies = auth_server
    with patch("vran.tag.api.permissions.check_user", mock):
        rsp = req.post_accept(server.url, c.id_ownership_request_test, cookies)
    assert rsp.status_code == 401


def test_no_cookies(auth_server):
    "Make sure that without cookies the response has a unauthenticated status."
    server, _ = auth_server
    rsp = req.post_accept(server.url, c.id_ownership_request_test)
    assert rsp.status_code == 401


def test_wrong_user(auth_server, ownership_request_user):
    "Make sure the wrong user can not accept an ownership request."
    server, cookies = auth_server
    rsp = req.post_accept(server.url, c.id_ownership_request_test, cookies=cookies)
    assert rsp.status_code == 403


def test_correct_user(auth_server1, ownership_request_user):
    "Make sure the correct user can accept an ownership request and ownership is transferred."
    server, _, cookies = auth_server1
    rsp = req.post_accept(server.url, c.id_ownership_request_test, cookies=cookies)
    assert rsp.status_code == 200
    tag_definition = TagDefinition.most_recent_by_id(
        ownership_request_user.id_tag_definition_persistent
    )
    assert tag_definition.owner == ownership_request_user.receiver


def test_correct_user_curated(auth_server, ownership_request_curated):
    """Make sure the correct user can accept an ownership request
    for a previously curated tag definition and ownership is transferred."""
    server, cookies = auth_server
    rsp = req.post_accept(
        server.url, c.id_ownership_request_curated_test, cookies=cookies
    )
    assert rsp.status_code == 200
    tag_definition = TagDefinition.most_recent_by_id(
        ownership_request_curated.id_tag_definition_persistent
    )
    assert tag_definition.owner == ownership_request_curated.receiver
    assert not tag_definition.curated


def test_changes_owner_of_mrs(auth_server1, ownership_request_user, user_editor):
    "Make sure that for existing merge requests the owner is changed"
    server, _, cookies = auth_server1
    id_mr_persistent = "ccc5e4bd-2db1-4c52-b21b-cd9d138c21ea"
    TagMergeRequest.objects.create(  # pylint: disable=no-member
        assigned_to=ownership_request_user.petitioner,
        created_by=user_editor,
        state=TagMergeRequest.OPEN,
        id_origin_persistent="origin_for_test",
        id_destination_persistent=ownership_request_user.id_tag_definition_persistent,
        created_at=c.time_edit_test,
        id_persistent=id_mr_persistent,
    )
    rsp = req.post_accept(server.url, c.id_ownership_request_test, cookies=cookies)
    assert rsp.status_code == 200
    tag_definition = TagDefinition.most_recent_by_id(
        ownership_request_user.id_tag_definition_persistent
    )
    assert tag_definition.owner == ownership_request_user.receiver
    assert (
        TagMergeRequest.objects.filter(  # pylint: disable=no-member
            id_persistent=id_mr_persistent
        )
        .get()
        .assigned_to
        == ownership_request_user.receiver
    )
