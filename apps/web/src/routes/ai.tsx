import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Brain } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Response } from "@/components/response";
import { ChatList } from "@/components/chat-list";
import { z } from "zod";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const aiSearchSchema = z.object({
	chatId: z.string().optional(),
});

export const Route = createFileRoute("/ai")({
	component: RouteComponent,
	validateSearch: aiSearchSchema,
});

function RouteComponent() {
	const { chatId } = Route.useSearch();
	const [input, setInput] = useState("");
	const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
	const [refetchChats, setRefetchChats] = useState<(() => void) | null>(null);
	const { messages, sendMessage, setMessages } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/ai",
			body: { chatId, model: selectedModel },
		}),
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Load chat messages when chatId changes
	useEffect(() => {
		if (chatId) {
			fetch(`/api/chats/${chatId}`)
				.then((res) => {
					if (!res.ok) throw new Error("Failed to load chat");
					return res.json();
				})
				.then((data) => {
					if (data.messages) {
						setMessages(data.messages);
					}
				})
				.catch((err) => {
					console.error("Failed to load chat:", err);
					// If chat loading fails, just start fresh
					setMessages([]);
				});
		} else {
			setMessages([]);
		}
	}, [chatId, setMessages]);

	// Refetch chats when a new conversation is created
	useEffect(() => {
		if (messages.length >= 2 && !chatId && typeof refetchChats === 'function') {
			refetchChats();
		}
	}, [messages.length, chatId, refetchChats]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const text = input.trim();
		if (!text) return;
		sendMessage({ text });
		setInput("");
	};

	return (
		<div className="flex h-full overflow-hidden">
			<ChatList onRefetch={setRefetchChats} />
			<div className="flex-1 flex flex-col overflow-hidden">
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 ? (
						<div className="text-center text-muted-foreground mt-8">
							What can I help you with today?
						</div>
					) : (
						messages.map((message) => (
							<div
								key={message.id}
								className={`p-3 rounded-lg ${
									message.role === "user"
										? "bg-primary/10 ml-8"
										: "bg-secondary/20 mr-8"
								}`}
							>
								<p className="text-sm font-semibold mb-1">
									{message.role === "user" ? "You" : "Olaf"}
								</p>
								{message.parts?.map((part, index) => {
									if (part.type === "text") {
										return <Response key={index}>{part.text}</Response>;
									}
									return null;
								})}
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>
				
				<div className="flex-shrink-0 border-t bg-background p-4">
					<div className="max-w-3xl mx-auto flex flex-col gap-2">
						<div className="flex justify-center">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="gap-2">
										<Brain className="h-4 w-4" />
										{selectedModel === "gpt-4o-mini" ? "GPT-4o Mini" : 
										 selectedModel === "gpt-4o" ? "GPT-4o" :
										 selectedModel === "gemini-2.0-flash-exp" ? "Gemini 2.0 Flash" :
										 selectedModel === "gemini-1.5-pro" ? "Gemini 1.5 Pro" : selectedModel}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onClick={() => setSelectedModel("gpt-4o-mini")}>
										GPT-4o Mini
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setSelectedModel("gpt-4o")}>
										GPT-4o
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setSelectedModel("gemini-2.0-flash-exp")}>
										Gemini 2.0 Flash
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setSelectedModel("gemini-1.5-pro")}>
										Gemini 1.5 Pro
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<form onSubmit={handleSubmit} className="flex items-center space-x-2">
							<Input
								name="prompt"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Ask anything"
								className="flex-1 h-14 text-lg px-4"
								autoComplete="off"
								autoFocus
							/>
							<Button type="submit" size="icon" className="h-14 w-14">
								<Send size={22} />
							</Button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}