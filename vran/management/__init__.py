"Combine routers for management"
from ninja import Router

from vran.management.display_txt.api import router as display_txt_router

router = Router()
router.add_router("display_txt", display_txt_router)
