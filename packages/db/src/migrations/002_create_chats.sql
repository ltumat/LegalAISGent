-- Create chats table
CREATE TABLE IF NOT EXISTS "chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"created_at" timestamp NOT NULL DEFAULT NOW(),
	"updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"chat_id" uuid NOT NULL REFERENCES "chat"("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"parts" jsonb,
	"created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "chat_user_id_idx" ON "chat"("user_id");
CREATE INDEX IF NOT EXISTS "chat_updated_at_idx" ON "chat"("updated_at");
CREATE INDEX IF NOT EXISTS "message_chat_id_idx" ON "message"("chat_id");
CREATE INDEX IF NOT EXISTS "message_created_at_idx" ON "message"("created_at");
