import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const conversations = pgTable("conversations", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	model: text("model").notNull().default("gpt-4o-mini"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: uuid("id").defaultRandom().primaryKey(),
	conversationId: uuid("conversation_id")
		.notNull()
		.references(() => conversations.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
	content: text("content").notNull(),
	metadata: jsonb("metadata"), // For storing model info, tokens, etc.
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
