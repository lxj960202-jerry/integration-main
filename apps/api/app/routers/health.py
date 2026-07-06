from typing import Any

from fastapi import APIRouter, HTTPException

from apps.api.app.config import get_settings
from apps.api.app.health import DependencyUnavailable, check_dependencies

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> dict[str, Any]:
    try:
        dependencies = await check_dependencies(get_settings())
    except DependencyUnavailable as error:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unavailable",
                "dependencies": error.dependencies,
            },
        ) from error

    return {"status": "ok", "dependencies": dependencies}
