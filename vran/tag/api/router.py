"Combination of tag definitions and instance API."
from vran.tag.api.definitions import router as definitions_router
from vran.tag.api.instances import router
from vran.tag.api.permissions import router as permissions_router
from vran.util.auth import vran_auth

definitions_router.add_router("permissions", permissions_router, auth=vran_auth)
router.add_router("definitions", definitions_router, auth=vran_auth)
