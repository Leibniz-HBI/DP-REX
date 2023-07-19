# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name,too-many-arguments
from urllib.parse import urljoin

import requests


def post_tag_def(url, tag_def, cookies=None):
    return post_tag_defs(url, [tag_def], cookies)


def post_tag_defs(url, tag_defs, cookies=None):
    return requests.post(
        urljoin(url, "/vran/api/tags/definitions"),
        json={"tag_definitions": tag_defs},
        cookies=cookies,
        timeout=900,
    )


def get_tagdefs(url, cookies=None):
    return requests.get(
        urljoin(url, "/vran/api/tags/definitions"),
        cookies=cookies,
        timeout=900,
    )


def post_tag_instance(url, tag, **kwargs):
    return post_tag_instances(url, [tag], **kwargs)


def post_tag_instances(url, tags, cookies=None):
    return requests.post(
        urljoin(url, "/vran/api/tags"),
        json={"tag_instances": tags},
        cookies=cookies,
        timeout=900,
    )


def post_tag_instance_chunks(url, tag_def_id, offset, limit, cookies=None):
    return requests.post(
        urljoin(url, "/vran/api/tags/chunk"),
        json={
            "id_tag_definition_persistent": tag_def_id,
            "offset": offset,
            "limit": limit,
        },
        cookies=cookies,
        timeout=900,
    )


def post_tag_def_children(url, id_persistent, cookies=None):
    return requests.post(
        urljoin(url, "vran/api/tags/definitions/children"),
        json={"id_parent_persistent": id_persistent},
        timeout=900,
        cookies=cookies,
    )


def post_tag_instance_values(
    url, id_entity_persistent, id_tag_definition_persistent, cookies=None
):
    return post_tag_instances_values(
        url, [(id_entity_persistent, id_tag_definition_persistent)], cookies
    )


def post_tag_instances_values(url, id_persistent_pairs, cookies):
    return requests.post(
        urljoin(url, "vran/api/tags/values"),
        json={
            "value_requests": [
                {
                    "id_entity_persistent": id_entity_persistent,
                    "id_tag_definition_persistent": id_tag_definition_persistent,
                }
                for id_entity_persistent, id_tag_definition_persistent in id_persistent_pairs
            ]
        },
        cookies=cookies,
        timeout=900,
    )


def post_tag_instances_for_entities(
    url,
    id_entity_persistent_list,
    id_tag_definition_persistent_list,
    id_contribution_persistent=None,
    id_merge_request_persistent=None,
    cookies=None,
):
    return requests.post(
        urljoin(url, "vran/api/tags/entities"),
        json={
            "id_tag_definition_persistent_list": id_tag_definition_persistent_list,
            "id_entity_persistent_list": id_entity_persistent_list,
            "id_contribution_persistent": id_contribution_persistent,
            "id_merge_request_persistent": id_merge_request_persistent,
        },
        cookies=cookies,
        timeout=900,
    )
