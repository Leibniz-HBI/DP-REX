"API models for contributions."
from typing import List, Optional

from ninja import Schema

from vran.tag.api.definitions import TagDefinitionResponse


class ContributionPostRequest(Schema):
    # pylint: disable=too-few-public-methods
    "Request data for adding a new contribution"
    name: str
    description: str
    has_header: bool


class ContributionPostResponse(Schema):
    # pylint: disable=too-few-public-methods
    "Response data for successful creation of a contribution"
    id_persistent: str


class ContributionChunkRequest(Schema):
    # pylint: disable=too-few-public-methods
    "Request body for requesting contribution candidates in chunks"
    offset: int
    limit: int


class ContributionCandidate(Schema):
    # pylint: disable=too-few-public-methods
    "API model for contribution candidates"
    id_persistent: str
    name: str
    description: str
    has_header: bool
    state: str
    author: str
    error_msg: Optional[str]
    error_details: Optional[str]
    match_tag_definition_list: Optional[List[TagDefinitionResponse]]


class ContributionCandidatePatchRequest(Schema):
    # pylint: disable=too-few-public-methods
    "API model for contribution candidate patch requests"
    name: Optional[str]
    description: Optional[str]
    has_header: Optional[bool]


class ContributionChunkResponse(Schema):
    # pylint: disable=too-few-public-methods
    "Response containing multiple contribution candidates."
    contributions: List[ContributionCandidate]
