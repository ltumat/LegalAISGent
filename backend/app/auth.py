from datetime import datetime, timedelta, timezone
import secrets
import uuid

import asyncpg
from asyncpg import Record
from asyncpg.exceptions import UniqueViolationError
from fastapi import HTTPException, Request, Response
from passlib.context import CryptContext

from .config import settings
from .schemas import SessionResponse, UserPublic

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SESSION_TTL = timedelta(hours=settings.session_ttl_hours)


def now_utc() -> datetime:
	return datetime.now(timezone.utc)


def set_session_cookie(response: Response, token: str) -> None:
	response.set_cookie(
		settings.session_cookie_name,
		token,
		max_age=int(SESSION_TTL.total_seconds()),
		httponly=True,
		secure=not settings.allow_insecure_cookies,
		samesite="lax",
		path="/",
	)


def clear_session_cookie(response: Response) -> None:
	response.delete_cookie(
		settings.session_cookie_name,
		path="/",
	)


async def create_session(
	connection: asyncpg.Connection, user_id: str, request: Request
) -> tuple[str, str]:
	token = secrets.token_urlsafe(32)
	session_id = str(uuid.uuid4())
	now = now_utc()
	expires_at = now + SESSION_TTL

	await connection.execute(
		"""
		INSERT INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		""",
		session_id,
		expires_at,
		token,
		now,
		now,
		request.client.host if request.client else None,
		request.headers.get("user-agent"),
		user_id,
	)

	return session_id, token


async def get_session_from_token(
	connection: asyncpg.Connection, token: str | None
) -> SessionResponse | None:
	if not token:
		return None

	record = await connection.fetchrow(
		"""
		SELECT s.id AS session_id, s.expires_at, u.id AS user_id, u.name, u.email
		FROM session s
		JOIN "user" u ON u.id = s.user_id
		WHERE s.token = $1 AND s.expires_at > timezone('utc', now())
		""",
		token,
	)

	if not record:
		return None

	return SessionResponse(
		session_id=record["session_id"],
		user=UserPublic(
			id=record["user_id"],
			name=record["name"],
			email=record["email"],
		),
	)


async def remove_session(connection: asyncpg.Connection, token: str | None) -> None:
	if not token:
		return

	await connection.execute("DELETE FROM session WHERE token = $1", token)


async def register_user(
	connection: asyncpg.Connection, email: str, name: str, password: str
) -> str:
	hashed_password = pwd_context.hash(password)
	user_id = str(uuid.uuid4())
	account_id = str(uuid.uuid4())
	now = now_utc()

	try:
		await connection.execute(
			"""
			INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			""",
			user_id,
			name,
			email,
			False,
			None,
			now,
			now,
		)
	except UniqueViolationError:
		raise HTTPException(status_code=400, detail="Email already registered")

	try:
		await connection.execute(
			"""
			INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			""",
			account_id,
			email,
			"email",
			user_id,
			hashed_password,
			now,
			now,
		)
	except UniqueViolationError:
		raise HTTPException(status_code=400, detail="Account already exists")

	return user_id


async def fetch_account_record(
	connection: asyncpg.Connection, email: str
) -> Record | None:
	return await connection.fetchrow(
		"""
		SELECT a.password, u.id AS user_id, u.name, u.email
		FROM account a
		JOIN "user" u ON u.id = a.user_id
		WHERE a.provider_id = 'email' AND a.account_id = $1
		LIMIT 1
		""",
		email,
	)


async def validate_credentials(connection: asyncpg.Connection, email: str, password: str):
	record = await fetch_account_record(connection, email)

	if not record or not record.get("password"):
		raise HTTPException(status_code=401, detail="Invalid email or password")

	if not pwd_context.verify(password, record["password"]):
		raise HTTPException(status_code=401, detail="Invalid email or password")

	return record
