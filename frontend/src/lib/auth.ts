import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { queryClient } from "./queryClient";

export interface SessionUser {
	id: string;
	name: string;
	email: string;
}

export interface SessionResponse {
	user: SessionUser;
	session_id: string;
}

const SESSION_QUERY_KEY = ["session"];

export const useSessionQuery = () =>
	useQuery({
		queryKey: SESSION_QUERY_KEY,
		queryFn: () => apiFetch<SessionResponse | null>("/api/auth/session"),
		refetchOnWindowFocus: false,
	});

export async function signUp(payload: {
	email: string;
	password: string;
	name: string;
}) {
	const data = await apiFetch<SessionResponse>("/api/auth/sign-up", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
	return data;
}

export async function signIn(payload: { email: string; password: string }) {
	const data = await apiFetch<SessionResponse>("/api/auth/sign-in", {
		method: "POST",
		body: JSON.stringify(payload),
	});
	await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
	return data;
}

export async function signOut() {
	await apiFetch("/api/auth/sign-out", { method: "POST" });
	await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}
