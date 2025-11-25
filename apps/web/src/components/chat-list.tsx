import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

interface Chat {
	id: string;
	title: string;
	model: string;
	createdAt: Date;
	updatedAt: Date;
}

interface ChatListProps {
	onRefetch?: (refetchFn: () => void) => void;
}

export function ChatList({ onRefetch }: ChatListProps) {
	const { data: chats, isLoading, refetch } = useQuery<Chat[]>({
		queryKey: ["chats"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/chats");
				if (!res.ok) return [];
				const data = await res.json();
				return Array.isArray(data) ? data : [];
			} catch (error) {
				console.log("Chat list error:", error);
				return [];
			}
		},
		retry: false,
	});

	useEffect(() => {
		if (onRefetch) {
			onRefetch(() => {
				refetch();
			});
		}
	}, [onRefetch, refetch]);

	if (isLoading) {
		return (
			<div className="w-64 border-r flex flex-col h-full overflow-hidden">
				<div className="p-4">Loading...</div>
			</div>
		);
	}

	return (
		<div className="w-64 border-r flex flex-col h-full overflow-hidden">
			<div className="flex-shrink-0 p-4 border-b">
				<Link to="/ai">
					<Button className="w-full" variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						New Chat
					</Button>
				</Link>
			</div>
			<div className="flex-1 overflow-y-auto p-2">
				{chats && chats.length > 0 ? (
					chats.map((chat) => (
						<Link
							key={chat.id}
							to="/ai"
							search={{ chatId: chat.id }}
							className="block"
						>
							<Button
								variant="ghost"
								className="w-full justify-start mb-1 text-left"
							>
								<MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
								<span className="truncate">{chat.title}</span>
							</Button>
						</Link>
					))
				) : (
					<p className="text-sm text-muted-foreground text-center mt-4">
						No chats yet
					</p>
				)}
			</div>
		</div>
	);
}
