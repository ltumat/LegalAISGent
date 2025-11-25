import { createFileRoute } from "@tanstack/react-router";
import { db, conversations, eq, desc } from "@LegalAISGent/db";
import { auth } from "@LegalAISGent/auth";

export const Route = createFileRoute("/api/chats/")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					const session = await auth.api.getSession({ headers: request.headers });
					
					if (!session?.user) {
						return new Response(JSON.stringify([]), {
							status: 200,
							headers: { "Content-Type": "application/json" },
						});
					}

					const chats = await db
						.select()
						.from(conversations)
						.where(eq(conversations.userId, session.user.id))
						.orderBy(desc(conversations.updatedAt));

					return new Response(JSON.stringify(chats), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("List chats error:", error);
					return new Response(
						JSON.stringify({ error: "Failed to list chats" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						}
					);
				}
			},
		},
	},
});
