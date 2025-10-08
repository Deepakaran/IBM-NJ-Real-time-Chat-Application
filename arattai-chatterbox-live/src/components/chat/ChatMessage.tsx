import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    profiles?: {
      username: string;
    };
  };
  isOwnMessage: boolean;
}

export const ChatMessage = ({ message, isOwnMessage }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex flex-col animate-fade-in",
        isOwnMessage ? "items-end" : "items-start"
      )}
    >
      {!isOwnMessage && (
        <div className="text-xs text-muted-foreground mb-1 px-1">
          {message.profiles?.username || "Unknown"}
        </div>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 break-words",
          isOwnMessage
            ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-sm"
            : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-sm"
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
      <div className="text-xs text-muted-foreground mt-1 px-1">
        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
      </div>
    </div>
  );
};