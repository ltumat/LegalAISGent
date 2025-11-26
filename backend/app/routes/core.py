from fastapi import APIRouter, Depends, HTTPException, Request

from ..auth import get_session_from_token
from ..config import settings
from ..db import get_connection

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
	return {"status": "ok"}


@router.get("/private", response_model=dict[str, str])
async def private_data(
	request: Request,
	connection=Depends(get_connection),
) -> dict[str, str]:
	session = await get_session_from_token(
		connection, request.cookies.get(settings.session_cookie_name)
	)
	if not session:
		raise HTTPException(status_code=401, detail="Authentication required")

	return {"message": "This is private", "user": session.user.model_dump()}
