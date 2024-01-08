# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name
from urllib.parse import urljoin

import requests


def get_tag_definition(url, cookies=None):
    return requests.get(
        urljoin(url, "/vran/api/manage/display_txt/order"),
        cookies=cookies,
        timeout=9,
    )


def post_append_tag_definition(url, id_tag_definition_persistent, cookies=None):
    return requests.post(
        urljoin(url, "/vran/api/manage/display_txt/order/append"),
        json={"id_tag_definition_persistent": id_tag_definition_persistent},
        cookies=cookies,
        timeout=9,
    )


def delete_tag_definition(url, id_tag_definition_persistent, cookies=None):
    return requests.delete(
        urljoin(
            url, f"/vran/api/manage/display_txt/order/{id_tag_definition_persistent}"
        ),
        cookies=cookies,
        timeout=9,
    )
