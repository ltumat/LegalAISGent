import { streamApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Response } from "@/components/response";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

const createId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2);

export const Route = createFileRoute("/ai")({
	component: RouteComponent,
});

function RouteComponent() {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const text = input.trim();
		if (!text || isStreaming) return;

		const userMessage: ChatMessage = {
			id: createId(),
			role: "user",
			content: text,
		};

		const assistantMessage: ChatMessage = {
			id: createId(),
			role: "assistant",
			content: "",
		};

		const nextMessages = [...messages, userMessage, assistantMessage];
		setMessages(nextMessages);
		setInput("");
		setIsStreaming(true);

		try {
			await streamApi(
				"/api/ai",
				{
					messages: nextMessages
						.filter((message) => message.id !== assistantMessage.id)
						.map((message) => ({
							role: message.role,
							content: message.content,
						})),
				},
				(chunk) => {
					setMessages((current) =>
						current.map((message) =>
							message.id === assistantMessage.id
								? { ...message, content: message.content + chunk }
								: message,
						),
					);
				},
			);
		} catch (error) {
			console.error(error);
			setMessages((current) =>
				current.map((message) =>
					message.id === assistantMessage.id
						? {
								...message,
								content: "Sorry, I couldn't generate a response right now.",
						  }
						: message,
				),
			);
			toast.error(
				error instanceof Error
					? error.message
					: "There was a problem generating a response.",
			);
		} finally {
			setIsStreaming(false);
		}
	};

	return (
		<div className="grid grid-rows-[1fr_auto] overflow-hidden w-full mx-auto p-4">
			<div className="overflow-y-auto space-y-4 pb-4">
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
							<Response>{message.content}</Response>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			<div className="flex justify-center">
				<form
					onSubmit={handleSubmit}
					className="w-2/3 flex items-center space-x-2 pt-2 border-t"
				>
					<Input
						name="prompt"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask anything"
						className="flex-1 h-14 text-lg px-4"
						autoComplete="off"
						autoFocus
						disabled={isStreaming}
					/>
					<Button type="submit" size="icon" className="h-14 w-14" disabled={isStreaming}>
						<Send size={22} />
					</Button>
				</form>
			</div>
		</div>
	);
}
