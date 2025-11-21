import { pgTable, text, integer, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const documentChunks = pgTable("document_chunks", {
	id: uuid("id").defaultRandom().primaryKey(),
	documentName: text("document_name"),
	chunkIndex: integer("chunk_index"),
	content: text("content"),
	embedding: vector("embedding", { dimensions: 1536 }),
	createdAt: timestamp("created_at").defaultNow(),
});
