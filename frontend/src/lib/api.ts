const baseFromEnv =
	typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL
		? import.meta.env.VITE_BACKEND_URL
		: undefined;

export const API_BASE_URL = (baseFromEnv || "http://localhost:8000").replace(/\/$/, "");

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
		credentials: "include",
	});

	const contentType = response.headers.get("content-type") || "";
	const payload = contentType.includes("application/json")
		? await response.json()
		: await response.text();

	if (!response.ok) {
		const message =
			typeof payload === "string"
				? payload
				: payload?.error ||
					payload?.message ||
					payload?.detail ||
					"Request failed";
		throw new Error(message);
	}

	return payload as T;
}

export async function streamApi(
	path: string,
	payload: unknown,
	onChunk: (chunk: string) => void,
) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		body: JSON.stringify(payload),
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});

	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || "Streaming request failed");
	}

	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("Streaming is not supported by this browser.");
	}

	const decoder = new TextDecoder();
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			onChunk(decoder.decode(value, { stream: true }));
		}
	}
}
