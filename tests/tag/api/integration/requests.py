# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name
from urllib.parse import urljoin

import requests


def post_tag_def(url, tag_def):
    return post_tag_defs(url, [tag_def])


def post_tag_defs(url, tag_defs):
    return requests.post(
        urljoin(url, "/vran/api/tags/definitions"),
        json={"tag_definitions": tag_defs},
        timeout=900,
    )


def get_tagdefs(url):
    return requests.get(
        urljoin(url, "/vran/api/tags/definitions"),
        timeout=900,
    )


def post_tag_instance(url, tag):
    return post_tag_instances(url, [tag])


def post_tag_instances(url, tags):
    return requests.post(
        urljoin(url, "/vran/api/tags"), json={"tag_instances": tags}, timeout=900
    )


def get_tag_chunked(url, tag_def_id, offset, limit):
    return requests.post(
        urljoin(url, "/vran/api/tags/definitions"),
        json={"tag_definition_id": tag_def_id, "offset": offset, "limit": limit},
        timeout=900,
    )
