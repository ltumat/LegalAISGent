import { z } from "zod";
import { db, conversations, messages, eq, desc } from "@LegalAISGent/db";
import { protectedProcedure, router } from "../index";

export const chatRouter = router({
	// List all conversations for the current user
	list: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(conversations)
			.where(eq(conversations.userId, ctx.session.user.id))
			.orderBy(desc(conversations.updatedAt));
	}),

	// Get a specific conversation with its messages
	get: protectedProcedure
		.input(z.object({ conversationId: z.uuid() }))
		.query(async ({ input, ctx }) => {
			const [conversation] = await db
				.select()
				.from(conversations)
				.where(eq(conversations.id, input.conversationId));

			if (!conversation || conversation.userId !== ctx.session.user.id) {
				throw new Error("Conversation not found");
			}

			const conversationMessages = await db
				.select()
				.from(messages)
				.where(eq(messages.conversationId, input.conversationId))
				.orderBy(messages.createdAt);

			return {
				conversation,
				messages: conversationMessages,
			};
		}),

	// Create a new conversation
	create: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1).max(200),
				model: z.string().default("gpt-4o-mini"),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [newConversation] = await db
				.insert(conversations)
				.values({
					title: input.title,
					userId: ctx.session.user.id,
					model: input.model,
				})
				.returning();

			return newConversation;
		}),

	// Update conversation title or model
	update: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().uuid(),
				title: z.string().min(1).max(200).optional(),
				model: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [conversation] = await db
				.select()
				.from(conversations)
				.where(eq(conversations.id, input.conversationId));

			if (!conversation || conversation.userId !== ctx.session.user.id) {
				throw new Error("Conversation not found");
			}

			const updateData: any = { updatedAt: new Date() };
			if (input.title) updateData.title = input.title;
			if (input.model) updateData.model = input.model;

			const [updated] = await db
				.update(conversations)
				.set(updateData)
				.where(eq(conversations.id, input.conversationId))
				.returning();

			return updated;
		}),

	// Delete a conversation
	delete: protectedProcedure
		.input(z.object({ conversationId: z.uuid() }))
		.mutation(async ({ input, ctx }) => {
			const [conversation] = await db
				.select()
				.from(conversations)
				.where(eq(conversations.id, input.conversationId));

			if (!conversation || conversation.userId !== ctx.session.user.id) {
				throw new Error("Conversation not found");
			}

			await db.delete(conversations).where(eq(conversations.id, input.conversationId));

			return { success: true };
		}),

	// Add a message to a conversation
	addMessage: protectedProcedure
		.input(
			z.object({
				conversationId: z.uuid(),
				role: z.enum(["user", "assistant", "system"]),
				content: z.string(),
				metadata: z.any().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [conversation] = await db
				.select()
				.from(conversations)
				.where(eq(conversations.id, input.conversationId));

			if (!conversation || conversation.userId !== ctx.session.user.id) {
				throw new Error("Conversation not found");
			}

			const [newMessage] = await db
				.insert(messages)
				.values({
					conversationId: input.conversationId,
					role: input.role,
					content: input.content,
					metadata: input.metadata,
				})
				.returning();

			// Update conversation's updatedAt timestamp
			await db
				.update(conversations)
				.set({ updatedAt: new Date() })
				.where(eq(conversations.id, input.conversationId));

			return newMessage;
		}),
});
