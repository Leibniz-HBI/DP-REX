"API endpoints for tag definitions."
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from django.db import IntegrityError
from ninja import Router, Schema

from vran.exception import (
    ApiError,
    DbObjectExistsException,
    EntityUpdatedException,
    NoChildTagDefintionsAllowedException,
    NoParentTagException,
    TagDefinitionExistsException,
    ValidationException,
)
from vran.tag.models_django import TagDefinition as TagDefintionDb
from vran.util.django import save_many_atomic

router = Router()


_tag_type_mapping_api_to_db = {
    "INNER": TagDefintionDb.INNER,
    "FLOAT": TagDefintionDb.FLOAT,
    "STRING": TagDefintionDb.STRING,
}

_tag_type_mapping_db_to_api = {
    TagDefintionDb.INNER: "INNER",
    TagDefintionDb.FLOAT: "FLOAT",
    TagDefintionDb.STRING: "STRING",
}


class TagDefinition(Schema):
    "API model for a tag definition."
    # pylint: disable=too-few-public-methods
    id_persistent: Optional[str]
    id_parent_persistent: Optional[str]
    name: str
    version: Optional[int]
    type: str


class TagDefinitionList(Schema):
    "API model for a list of tag definitions."
    # pylint: disable=too-few-public-methods
    tag_definitions: List[TagDefinition]


@router.post("", response={200: TagDefinitionList, 400: ApiError, 500: ApiError})
def post_tag_definitions(_, tag_definition_list: TagDefinitionList):
    "Add tag definitions."
    # pylint: disable=too-many-return-statements
    now = datetime.utcnow()
    tag_def_apis = tag_definition_list.tag_definitions
    try:
        tag_def_dbs = [
            tag_definition_api_to_db(tag_def, now) for tag_def in tag_def_apis
        ]
    except ValidationException as exc:
        return 400, ApiError(msg=str(exc))
    except NoParentTagException as exc:
        return 400, ApiError(
            msg=f"There is no tag definition with id_persistent {exc.id_persistent}."
        )
    except NoChildTagDefintionsAllowedException as exc:
        return 400, ApiError(
            msg=f"Tag definition with id_persistent {exc.id_persistent} "
            "is not allowed to have child tags."
        )
    except TagDefinitionExistsException as exc:
        return 400, ApiError(
            msg="There is an existing tag definition with name "
            f"{exc.tag_name} and id_parent_persistent {exc.id_parent_persistent}. "
            f"Its id_persistent is {exc.id_persistent}."
        )
    except DbObjectExistsException as exc:
        return 500, ApiError(
            msg=f"Could not generate id_persistent for tag definition with name {exc.display_txt}."
        )
    except EntityUpdatedException as exc:
        return 500, ApiError(
            msg="There has been a concurrent modification to the tag definition "
            f"with id_persistent {exc.id_affected}."
        )
    except KeyError as exc:
        return 400, ApiError(msg=f"Type {exc.args[0]} is not known.")

    tag_def_db_writes = [tag_def for tag_def, do_write in tag_def_dbs if do_write]
    try:
        save_many_atomic(tag_def_db_writes)
    except IntegrityError:
        return 500, ApiError(msg="Provided data not consistent with database.")

    return 200, TagDefinitionList(
        tag_definitions=[
            tag_definition_db_to_api(tag_def[0]) for tag_def in tag_def_dbs
        ]
    )


def tag_definition_api_to_db(
    tag_definition: TagDefinition, time_edit: datetime
) -> TagDefintionDb:
    "Convert a tag definition from API to database model."
    if tag_definition.id_persistent:
        persistent_id = tag_definition.id_persistent
        if tag_definition.version is None:
            raise ValidationException(
                f"Tag definition with id_persistent {tag_definition.id_persistent} "
                "has no previous version."
            )
    else:
        if tag_definition.version:
            raise ValidationException(
                f"Tag definition with name {tag_definition.name} "
                "has version but no id_persistent."
            )
        persistent_id = str(uuid4())
    return TagDefintionDb.change_or_create(
        id_persistent=persistent_id,
        id_parent_persistent=tag_definition.id_parent_persistent,
        version=tag_definition.version,
        time_edit=time_edit,
        name=tag_definition.name,
        type=_tag_type_mapping_api_to_db[tag_definition.type],
    )


def tag_definition_db_to_api(tag_definition: TagDefintionDb) -> TagDefinition:
    "Convert a tag defintion from database to API model."
    return TagDefinition(
        id_persistent=tag_definition.id_persistent,
        id_parent_persistent=tag_definition.id_parent_persistent,
        name=tag_definition.name,
        version=tag_definition.id,
        type=_tag_type_mapping_db_to_api[tag_definition.type],
    )
