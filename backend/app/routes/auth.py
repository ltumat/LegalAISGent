from fastapi import APIRouter, Depends, Request, Response

from ..auth import (
	clear_session_cookie,
	create_session,
	get_session_from_token,
	register_user,
	remove_session,
	set_session_cookie,
	validate_credentials,
)
from ..config import settings
from ..db import get_connection
from ..schemas import SessionResponse, SignInRequest, SignUpRequest, UserPublic

router = APIRouter()


@router.post("/sign-up", response_model=SessionResponse)
async def sign_up(
	payload: SignUpRequest,
	request: Request,
	response: Response,
	connection=Depends(get_connection),
) -> SessionResponse:
	user_id = await register_user(
		connection, payload.email, payload.name, payload.password
	)
	session_id, token = await create_session(connection, user_id, request)
	set_session_cookie(response, token)

	return SessionResponse(
		session_id=session_id,
		user=UserPublic(id=user_id, name=payload.name, email=payload.email),
	)


@router.post("/sign-in", response_model=SessionResponse)
async def sign_in(
	payload: SignInRequest,
	request: Request,
	response: Response,
	connection=Depends(get_connection),
) -> SessionResponse:
	record = await validate_credentials(connection, payload.email, payload.password)

	session_id, token = await create_session(connection, record["user_id"], request)
	set_session_cookie(response, token)

	return SessionResponse(
		session_id=session_id,
		user=UserPublic(
			id=record["user_id"], name=record["name"], email=record["email"]
		),
	)


@router.post("/sign-out")
async def sign_out(
	request: Request,
	response: Response,
	connection=Depends(get_connection),
) -> dict[str, str]:
	await remove_session(connection, request.cookies.get(settings.session_cookie_name))
	clear_session_cookie(response)
	return {"status": "signed_out"}


@router.get("/session", response_model=SessionResponse | None)
async def session(
	request: Request, connection=Depends(get_connection)
) -> SessionResponse | None:
	return await get_session_from_token(
		connection, request.cookies.get(settings.session_cookie_name)
	)
