"Combination of tag defintions and instance API."
from vran.tag.api.definitions import router as defintions_router
from vran.tag.api.instances import router
from vran.util.auth import vran_auth

router.add_router("definitions", defintions_router, auth=vran_auth)
