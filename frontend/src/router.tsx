import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import Loader from "./components/loader";
import { queryClient } from "./lib/queryClient";
import "./index.css";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { queryClient },
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <div>Not Found</div>,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	});
	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
