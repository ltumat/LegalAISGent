from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

from ..config import settings
from ..prompt_loader import load_system_prompt
from ..schemas import ChatRequest

router = APIRouter()


@router.post("/ai")
async def chat(request: ChatRequest) -> StreamingResponse:
	if not settings.openai_api_key:
		raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

	client = AsyncOpenAI(api_key=settings.openai_api_key)
	system_prompt = load_system_prompt()

	async def iterator() -> AsyncGenerator[str, None]:
		try:
			stream = await client.chat.completions.create(
				model=settings.openai_model,
				messages=[
					{"role": "system", "content": system_prompt},
					*[
						{"role": message.role, "content": message.content}
						for message in request.messages
					],
				],
				stream=True,
			)

			async for chunk in stream:
				delta = chunk.choices[0].delta.content
				if delta:
					yield delta
		except Exception as exc:  # pragma: no cover - best-effort error surface
			raise HTTPException(status_code=500, detail="Chat generation failed") from exc

	return StreamingResponse(iterator(), media_type="text/plain")
