# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name
import requests


def get_merge_requests(url, cookies=None):
    return requests.get(url + "/vran/api/merge_requests", cookies=cookies, timeout=900)


def get_conflicts(url, id_merge_request_persistent, cookies=None):
    return requests.get(
        url + f"/vran/api/merge_requests/{id_merge_request_persistent}/conflicts",
        cookies=cookies,
        timeout=900,
    )


def post_resolution(  # pylint: disable=too-many-arguments
    url,
    id_merge_request_persistent,
    id_entity_persistent,
    id_entity_version,
    id_tag_definition_origin_persistent,
    id_tag_definition_origin_version,
    id_tag_definition_destination_persistent,
    id_tag_definition_destination_version,
    id_tag_instance_origin_persistent,
    id_tag_instance_origin_version,
    id_tag_instance_destination_persistent,
    id_tag_instance_destination_version,
    replace,
    cookies=None,
):
    return requests.post(
        url + f"/vran/api/merge_requests/{id_merge_request_persistent}/resolve",
        json={
            "id_entity_version": id_entity_version,
            "id_tag_definition_origin_version": id_tag_definition_origin_version,
            "id_tag_definition_destination_version": id_tag_definition_destination_version,
            "id_tag_instance_origin_version": id_tag_instance_origin_version,
            "id_tag_instance_destination_version": id_tag_instance_destination_version,
            "id_entity_persistent": id_entity_persistent,
            "id_tag_definition_origin_persistent": id_tag_definition_origin_persistent,
            "id_tag_definition_destination_persistent": id_tag_definition_destination_persistent,
            "id_tag_instance_origin_persistent": id_tag_instance_origin_persistent,
            "id_tag_instance_destination_persistent": id_tag_instance_destination_persistent,
            "replace": replace,
        },
        cookies=cookies,
        timeout=900,
    )


def post_start_merge(url, id_merge_request_persistent, cookies=None):
    return requests.post(
        url + f"/vran/api/merge_requests/{id_merge_request_persistent}/merge",
        cookies=cookies,
        timeout=900,
    )
