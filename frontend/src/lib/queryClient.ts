import {
	QueryCache,
	QueryClient,
	type QueryClientConfig,
} from "@tanstack/react-query";
import { toast } from "sonner";

const queryClientConfig: QueryClientConfig = {
	queryCache: new QueryCache({
		onError: (error) => {
			toast.error(error.message);
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 60_000,
			retry: false,
		},
	},
};

export const queryClient = new QueryClient(queryClientConfig);
