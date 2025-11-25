import { createFileRoute } from "@tanstack/react-router";
import { db, conversations, messages as messagesTable, eq } from "@LegalAISGent/db";
import { auth } from "@LegalAISGent/auth";

export const Route = createFileRoute("/api/chats/$chatId")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				try {
					const session = await auth.api.getSession({ headers: request.headers });
					
					if (!session?.user) {
						return new Response(JSON.stringify({ error: "Unauthorized" }), {
							status: 401,
							headers: { "Content-Type": "application/json" },
						});
					}

					const chatId = params.chatId;
					
					// Get conversation
					const [conversationData] = await db
						.select()
						.from(conversations)
						.where(eq(conversations.id, chatId));

					if (!conversationData || conversationData.userId !== session.user.id) {
						return new Response(JSON.stringify({ error: "Chat not found" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
					}

					// Get messages
					const chatMessages = await db
						.select()
						.from(messagesTable)
						.where(eq(messagesTable.conversationId, chatId))
						.orderBy(messagesTable.createdAt);

					return new Response(
						JSON.stringify({
							chat: conversationData,
							messages: chatMessages.map(msg => ({
								id: msg.id,
								role: msg.role,
								parts: (msg.metadata as any)?.parts || [{ type: "text", text: msg.content }],
							})),
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						}
					);
				} catch (error) {
					console.error("Get chat error:", error);
					return new Response(
						JSON.stringify({ error: "Failed to get chat" }),
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
