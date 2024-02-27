"Model conversions for tags."
from vran.tag.api.models_api import TagDefinitionResponse
from vran.tag.models_django import TagDefinition as TagDefinitionDb
from vran.tag.queue import (
    get_tag_definition_name_path,
    get_tag_definition_name_path_from_parts,
)
from vran.user.models_conversion import (
    permission_group_db_to_api,
    user_db_to_public_user_info,
)

_tag_type_mapping_db_to_api = {
    TagDefinitionDb.INNER: "INNER",
    TagDefinitionDb.FLOAT: "FLOAT",
    TagDefinitionDb.STRING: "STRING",
}


def tag_definition_db_dict_to_api(
    tag_definition: TagDefinitionDb,
) -> TagDefinitionResponse:
    "Convert a tag definition from database to API model."
    id_persistent = tag_definition["id_persistent"]
    name = tag_definition["name"]
    if tag_definition["owner"] is None or tag_definition["owner"]["username"] is None:
        owner = None
    else:
        owner = tag_definition["owner"]
        owner["permission_group"] = permission_group_db_to_api[
            owner["permission_group"]
        ]
    return TagDefinitionResponse(
        id_persistent=id_persistent,
        id_parent_persistent=tag_definition["id_parent_persistent"],
        name=name,
        name_path=get_tag_definition_name_path_from_parts(id_persistent, name),
        version=tag_definition["id"],
        type=_tag_type_mapping_db_to_api[tag_definition["type"]],
        owner=owner,
        curated=tag_definition["curated"],
        hidden=tag_definition["hidden"],
        disabled=tag_definition["disabled"],
    )


def tag_definition_db_to_api(tag_definition: TagDefinitionDb) -> TagDefinitionResponse:
    "Convert a tag definition from database to API model."
    owner = tag_definition.owner
    if owner is None:
        username = None
    else:
        username = user_db_to_public_user_info(owner)
    return TagDefinitionResponse(
        id_persistent=tag_definition.id_persistent,
        id_parent_persistent=tag_definition.id_parent_persistent,
        name=tag_definition.name,
        name_path=get_tag_definition_name_path(tag_definition),
        version=tag_definition.id,
        type=_tag_type_mapping_db_to_api[tag_definition.type],
        owner=username,
        curated=tag_definition.curated,
        hidden=tag_definition.hidden,
        disabled=tag_definition.disabled,
    )


_tag_type_mapping_api_to_db = {
    "INNER": TagDefinitionDb.INNER,
    "FLOAT": TagDefinitionDb.FLOAT,
    "STRING": TagDefinitionDb.STRING,
}
