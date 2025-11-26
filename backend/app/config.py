from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	database_url: str
	openai_api_key: str | None = None
	openai_model: str = "gpt-4o-mini"
	frontend_origin: str = "http://localhost:3001"
	session_cookie_name: str = "session_token"
	session_ttl_hours: int = 24 * 7
	allow_insecure_cookies: bool = True

	model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
