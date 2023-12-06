"Router combination for merge requests"
from vran.merge_request.api import router
from vran.merge_request.entity.api import router as entity_merge_request_router
from vran.util.auth import vran_auth

router.add_router("entities", entity_merge_request_router, auth=vran_auth)
