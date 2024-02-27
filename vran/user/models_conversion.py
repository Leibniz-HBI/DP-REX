"Model conversions for user information."
from vran.user.models_api.public import PublicUserInfo
from vran.util import VranUser

permission_group_db_to_api = {
    VranUser.APPLICANT: "APPLICANT",
    VranUser.READER: "READER",
    VranUser.CONTRIBUTOR: "CONTRIBUTOR",
    VranUser.EDITOR: "EDITOR",
    VranUser.COMMISSIONER: "COMMISSIONER",
}


def user_db_to_public_user_info(user):
    "Convert a django user to a public user info"
    if user is None:
        return None
    return PublicUserInfo(
        username=user.get_username(),
        id_persistent=str(user.id_persistent),
        permission_group=permission_group_db_to_api[user.permission_group],
    )


def user_db_to_public_user_info_dict(user: VranUser):
    "Convert a django user to a public user info dictionary"
    if user is None:
        return None
    return {
        "username": user.get_username(),
        "id_persistent": str(user.id_persistent),
        "permission_group": permission_group_db_to_api[user.permission_group],
        "id": user.id,
    }
