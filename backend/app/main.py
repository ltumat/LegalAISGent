from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_pool, create_pool
from .routes import auth, chat, core


@asynccontextmanager
async def lifespan(app: FastAPI):
	app.state.db_pool = await create_pool()
	yield
	await close_pool(app.state.db_pool)


app = FastAPI(title="LegalAISGent API", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[settings.frontend_origin],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(core.router, prefix="/api", tags=["core"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
