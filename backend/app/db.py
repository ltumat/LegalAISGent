from collections.abc import AsyncIterator

import asyncio
import asyncpg
from fastapi import Request

from .config import settings


async def create_pool() -> asyncpg.Pool:
	retries = 10
	delay_seconds = 1.5
	last_exc: Exception | None = None

	for attempt in range(1, retries + 1):
		try:
			return await asyncpg.create_pool(settings.database_url, min_size=1, max_size=10)
		except Exception as exc:  # pragma: no cover - startup guardrail
			last_exc = exc
			if attempt == retries:
				break
			await asyncio.sleep(delay_seconds)

	raise RuntimeError(
		"Could not connect to the database after multiple attempts. "
		"Confirm DATABASE_URL and that Postgres is running "
		"(try `bun run db:start`)."
	) from last_exc


async def close_pool(pool: asyncpg.Pool) -> None:
	await pool.close()


async def get_connection(request: Request) -> AsyncIterator[asyncpg.Connection]:
	pool: asyncpg.Pool = request.app.state.db_pool
	async with pool.acquire() as connection:
		yield connection
