import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@LegalAISGent/api/routers/index";
import { createContext } from "@LegalAISGent/api/context";
import { createFileRoute } from "@tanstack/react-router";

function handler({ request }: { request: Request }) {
	return fetchRequestHandler({
		req: request,
		router: appRouter,
		createContext,
		endpoint: "/api/trpc",
	});
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
		},
	},
});
