"API methods for tag instances."
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from django.db import IntegrityError
from ninja import Router, Schema

from vran.exception import (
    ApiError,
    EntityMissingException,
    EntityUpdatedException,
    InvalidTagValueException,
    TagDefinitionMissingException,
    TagInstanceExistsException,
    ValidationException,
)
from vran.tag.models_django import TagInstance as TagInstanceDb
from vran.util.django import save_many_atomic

router = Router()

MAX_TAG_INSTANCE_CHUNK_LIMIT = 10000
MAX_TAG_INSTANCE_VALUE_LIMIT = 50000


class TagInstancePost(Schema):
    # pylint: disable=too-few-public-methods
    "A single API tag instance for post requests."
    id_entity_persistent: str
    id_tag_definition_persistent: str
    value: Optional[str]
    id_persistent: Optional[str]
    version: Optional[int]


class TagInstancePostList(Schema):
    # pylint: disable=too-few-public-methods
    "Multiple tag instances for post requests."
    tag_instances: List[TagInstancePost]


class TagInstancePostChunkRequest(Schema):
    # pylint: disable=too-few-public-methods
    "Request body for geting instances of a tag."
    id_tag_definition_persistent: str
    offset: int
    limit: int


class TagInstanceValueRequest(Schema):
    # pylint: disable=too-few-public-methods
    "Reuqest body for getting a specific value"
    id_entity_persistent: str
    id_tag_definition_persistent: str


class TagInstanceValueRequestList(Schema):
    # pylint: disable=too-few-public-methods
    "Request body for multiple value request"
    value_requests: List[TagInstanceValueRequest]


class TagInstanceValueResponse(Schema):
    # pylint: disable=too-few-public-methods
    "Response for a value request"
    id_entity_persistent: str
    id_tag_definition_persistent: str
    values: List[TagInstancePost]


class TagInstanceValueResponseList(Schema):
    # pylint: disable=too-few-public-methods
    "Multiple Value request responses"
    value_responses: List[TagInstanceValueResponse]


class TagInstanceUpdatedResponse(Schema):
    # pylint: disable=too-few-public-methods
    "Informatation on updates when submitting values"
    msg: str
    tag_instances: List[TagInstancePost]


@router.post(
    "",
    response={
        200: TagInstancePostList,
        400: ApiError,
        409: TagInstanceUpdatedResponse,
        500: ApiError,
    },
)
def post_tag_instance(_, tag_list: TagInstancePostList):
    "Create or change a tag instance."
    # pylint: disable=too-many-return-statements
    tag_apis = tag_list.tag_instances
    now = datetime.utcnow()
    try:
        tag_dbs = [tag_instance_api_to_db(tag, now) for tag in tag_apis]
    except ValidationException as exc:
        return 400, ApiError(msg=str(exc))
    except TagInstanceExistsException as exc:
        return 500, ApiError(
            msg="Could not generate id_persistent for tag instance with "
            f"id_entity_persistent {exc.id_entity_persistent}, "
            f"id_tag_definition_persistent {exc.id_tag_definition_persistent} and "
            f"value {exc.value}."
        )
    except EntityMissingException as exc:
        return 400, ApiError(
            msg=f"There is no entity with id_persistent {exc.id_persistent}."
        )
    except TagDefinitionMissingException as exc:
        return 400, ApiError(
            msg=f"There is no tag definition with id_persistent {exc.id_persistent}."
        )
    except InvalidTagValueException as exc:
        return 400, ApiError(
            msg=f"Value {exc.value} should be of type {exc.type_name} "
            f"for tag with id_persistent {exc.tag_id_persistent}."
        )
    except EntityUpdatedException as exc:
        return 409, TagInstanceUpdatedResponse(
            msg="There has been a concurrent modification "
            f"to the tag instance with id_persistent {exc.new_value.id_persistent}.",
            tag_instances=[tag_instance_db_to_api(exc.new_value)],
        )
    tag_db_saves = [tag for tag, do_write in tag_dbs if do_write]
    try:
        save_many_atomic(tag_db_saves)
    except IntegrityError as exc:
        return 500, ApiError(msg="Provided data not consistent with database.")
    response_tag_instances = [tag_instance_db_to_api(tag) for tag, _ in tag_dbs]
    return 200, TagInstancePostList(tag_instances=response_tag_instances)


@router.post("chunk", response={200: TagInstancePostList, 400: ApiError, 500: ApiError})
def post_tag_instance_chunks(_, chunk_req: TagInstancePostChunkRequest):
    "API method for retrieving a chunk of tag instances."
    if chunk_req.limit > MAX_TAG_INSTANCE_CHUNK_LIMIT:
        return 400, ApiError(
            msg=f"Please specify limit smaller than {MAX_TAG_INSTANCE_CHUNK_LIMIT}."
        )
    try:
        instance_dbs = TagInstanceDb.by_tag_chunked(
            chunk_req.id_tag_definition_persistent, chunk_req.offset, chunk_req.limit
        )
        instance_apis = [tag_instance_db_to_api(tag) for tag in instance_dbs]
        return 200, TagInstancePostList(tag_instances=instance_apis)
    except TagDefinitionMissingException as exc:
        return 400, ApiError(
            msg=f"Tag definition with id_persistent {exc.id_persistent} does not exist."
        )
    except Exception:  # pylint: disable=broad-except
        return 500, ApiError(msg="Could not get requested chunk.")


@router.post(
    "values",
    response={
        200: TagInstanceValueResponseList,
        400: ApiError,
        404: ApiError,
        500: ApiError,
    },
)
def post_tag_instance_values(_, values_req: TagInstanceValueRequestList):
    "API method for obtaining specific tag instance values."
    if len(values_req.value_requests) > MAX_TAG_INSTANCE_VALUE_LIMIT:
        return 400, ApiError(
            msg=f"Please specify limit smaller than {MAX_TAG_INSTANCE_VALUE_LIMIT}."
        )
    try:
        ret = []
        for req in values_req.value_requests:
            id_entity_persistent = req.id_entity_persistent
            id_tag_definition_persistent = req.id_tag_definition_persistent
            vals = TagInstanceDb.most_recents_by_entity_and_definition_ids(
                id_entity_persistent, id_tag_definition_persistent
            )
            ret.append(
                TagInstanceValueResponse(
                    id_entity_persistent=id_entity_persistent,
                    id_tag_definition_persistent=id_tag_definition_persistent,
                    values=[tag_instance_db_to_api(val) for val in vals],
                )
            )
        return 200, TagInstanceValueResponseList(value_responses=ret)
    except Exception:  # pylint: disable=broad-except
        return 500, ApiError(msg="Could not get requested values.")


def tag_instance_api_to_db(tag_api: TagInstancePost, time: datetime):
    "Convert a tag instance from API to databse representation."
    if tag_api.id_persistent:
        persistent_id = tag_api.id_persistent
        if tag_api.version is None:
            raise ValidationException(
                f"Tag instance with id_persistent {tag_api.id_persistent} "
                "has no previous version."
            )
    else:
        if tag_api.version:
            raise ValidationException(
                f"Tag instance with id_entity_persistent {tag_api.id_entity_persistent}, "
                f"id_tag_definition_persistent {tag_api.id_tag_definition_persistent} and "
                f"value {tag_api.value} has version but no id_persistent."
            )
        persistent_id = str(uuid4())
    return TagInstanceDb.change_or_create(
        id_persistent=persistent_id,
        id_entity_persistent=tag_api.id_entity_persistent,
        id_tag_definition_persistent=tag_api.id_tag_definition_persistent,
        value=tag_api.value,
        time_edit=time,
        version=tag_api.version,
    )


def tag_instance_db_to_api(tag_db: TagInstanceDb) -> TagInstancePost:
    "Convert tag istances from databse to API representation."
    return TagInstancePost(
        id_persistent=tag_db.id_persistent,
        id_entity_persistent=tag_db.id_entity_persistent,
        id_tag_definition_persistent=tag_db.id_tag_definition_persistent,
        value=tag_db.value,
        version=tag_db.id,
    )
