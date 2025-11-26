import { createServerFn } from "@tanstack/react-start";

const backendUrl =
	(typeof process !== "undefined" && process.env.BACKEND_URL) ||
	(typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
	"http://localhost:8000";

export const getUser = createServerFn({ method: "GET" }).handler(
	async ({ request }) => {
		const response = await fetch(`${backendUrl}/api/auth/session`, {
			headers: {
				cookie: request.headers.get("cookie") || "",
			},
			credentials: "include",
		});

		if (!response.ok) {
			return null;
		}

		return response.json();
	},
);
