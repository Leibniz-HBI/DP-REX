"Combination of tag defintions and instance API."
from vran.tag.api.definitions import router as defintions_router
from vran.tag.api.instances import router

router.add_router("definitions", defintions_router)
