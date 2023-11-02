# pylint: disable=missing-module-docstring, missing-function-docstring,redefined-outer-name,invalid-name,disable=unused-argument
import tests.contribution.common as c
import tests.user.common as cu

contribution_post0 = {
    "name": c.name_test0,
    "description": c.description_test0,
    "anonymous": True,
    "has_header": False,
}

contribution_post1 = {
    "name": c.name_test1,
    "description": c.description_test1,
    "anonymous": False,
    "has_header": True,
}

contribution_test_upload0 = {
    "name": c.name_test0,
    "description": c.description_test0,
    "anonymous": True,
    "has_header": False,
    "author": None,
    "state": "UPLOADED",
    "error_msg": None,
    "error_details": None,
}

contribution_test_upload_0 = {
    "name": c.name_test1,
    "description": c.description_test1,
    "anonymous": False,
    "has_header": True,
    "author": cu.test_username,
    "state": "UPLOADED",
    "error_msg": None,
    "error_details": None,
}

contribution_test_columns_assigned0 = {
    "name": c.name_test0,
    "id_persistent": c.id_test0,
    "description": c.description_test0,
    "anonymous": True,
    "has_header": False,
    "author": None,
    "state": "COLUMNS_ASSIGNED",
    "error_msg": None,
    "error_details": None,
}

tag_def_test0 = {
    "name": c.name_definition_test0,
    "id_persistent": c.id_persistent_tag_def_test0,
    "id_existing_persistent": None,
    "index_in_file": 9000,
    "discard": False,
}
