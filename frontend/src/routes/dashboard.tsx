import { getUser } from "@/functions/get-user";
import { apiFetch } from "@/lib/api";
import type { SessionResponse } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext<{ session: SessionResponse }>();

	const privateData = useQuery({
		queryKey: ["private-data"],
		queryFn: () => apiFetch<{ message: string }>("/api/private"),
	});

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session?.user.name}</p>
			<p>API: {privateData.data?.message}</p>
		</div>
	);
}
