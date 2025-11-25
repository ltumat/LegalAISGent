import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { loadFile } from "@/utils/loadFile";
import { fileURLToPath } from "url";
import { db, conversations, messages as messagesTable, eq } from "@LegalAISGent/db";
import { auth } from "@LegalAISGent/auth";

async function loadSystemPrompt() {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const filePath = path.resolve(__dirname, "../../../../prompts/system-prompt.xml");
	const xml = await loadFile(filePath);

	const parser = new XMLParser({ ignoreAttributes: false });
	const data = parser.parse(xml);

	const p = data.prompt;
	const rules = Array.isArray(p.rules.rule) ? p.rules.rule.join("\n") : p.rules.rule;

	// Merge relevant sections into a single system prompt string
	const systemPrompt = `
Version ${p["@_version"]}, Jurisdiction: ${p["@_jurisdiction"]}
Persona: ${p.persona}
Tone: ${p.tone}
Disclaimers: ${p.disclaimers}

Rules:
${rules}

Response Format:
${p.outputFormat}
`;

	return systemPrompt.trim();
}

export const Route = createFileRoute("/api/ai/$")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const { messages: uiMessages, chatId, model = "gpt-4o-mini" }: { messages: UIMessage[]; chatId?: string; model?: string } = await request.json();

					// Get user session (optional - guests can use the chat too)
					let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
					try {
						session = await auth.api.getSession({ headers: request.headers });
					} catch (error) {
						// Guest user - continue without saving to database
						console.log("Guest user detected");
					}
					
					// If chatId is provided, load existing messages from database
					let currentChatId = chatId;
					
					if (session?.user) {
						if (chatId) {
							// Load existing messages (already in client state)
						} else {
							// Create new conversation if user is logged in
							const userMessage = uiMessages.find(m => m.role === "user");
							const messageText = userMessage?.parts?.[0]?.type === "text" 
								? userMessage.parts[0].text 
								: "New Chat";
							const title = messageText.substring(0, 50);
							
							const [newConversation] = await db
								.insert(conversations)
								.values({
									title,
									userId: session.user.id,
									model,
								})
								.returning();
							
							currentChatId = newConversation.id;
						}
						
						// Save new user message
						const userMessage = uiMessages[uiMessages.length - 1];
						if (userMessage && currentChatId) {
							const messageText = userMessage.parts?.[0]?.type === "text" 
								? userMessage.parts[0].text 
								: "";
							await db.insert(messagesTable).values({
								conversationId: currentChatId,
								role: userMessage.role,
								content: messageText,
								metadata: { parts: userMessage.parts },
							});
						}
					}

					const systemPrompt = await loadSystemPrompt();

					// Select AI provider based on model
					let aiModel;
					if (model.startsWith('gemini-')) {
						aiModel = google(model);
					} else {
						aiModel = openai(model);
					}

					const result = streamText({
						model: aiModel,
						messages: [
							{ role: "system", content: systemPrompt },
							...convertToModelMessages(uiMessages),
						],
						onFinish: async ({ text }) => {
							// Save assistant response to database if user is logged in
							if (session?.user && currentChatId) {
								await db.insert(messagesTable).values({
									conversationId: currentChatId,
									role: "assistant",
									content: text,
								});
								
								// Update conversation timestamp
								await db
									.update(conversations)
									.set({ updatedAt: new Date() })
									.where(eq(conversations.id, currentChatId));
							}
						},
					});

					return result.toUIMessageStreamResponse();
				} catch (error) {
					console.error("AI API error:", error);
					return new Response(
						JSON.stringify({ error: "Failed to process AI request" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});