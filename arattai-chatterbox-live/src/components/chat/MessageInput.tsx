import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  profileId: string | null;
}

export const MessageInput = ({ profileId }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const updateTypingStatus = async (typing: boolean) => {
    if (!profileId) return;

    try {
      const { data: existingStatus } = await supabase
        .from("typing_status")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      if (existingStatus) {
        await supabase
          .from("typing_status")
          .update({ is_typing: typing, updated_at: new Date().toISOString() })
          .eq("profile_id", profileId);
      } else {
        await supabase
          .from("typing_status")
          .insert([{ profile_id: profileId, is_typing: typing }]);
      }
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !profileId || isSending) return;

    setIsSending(true);
    setIsTyping(false);
    updateTypingStatus(false);

    try {
      const { error } = await supabase.from("messages").insert([
        {
          profile_id: profileId,
          content: message.trim(),
        },
      ]);

      if (error) throw error;

      setMessage("");
      textareaRef.current?.focus();
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[50px] max-h-[150px] resize-none bg-background"
          disabled={isSending}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
};