import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingStatus {
  id: string;
  profile_id: string;
  is_typing: boolean;
  profiles?: {
    username: string;
  };
}

interface TypingIndicatorProps {
  profileId: string | null;
}

export const TypingIndicator = ({ profileId }: TypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);

  useEffect(() => {
    loadTypingStatus();

    const channel = supabase
      .channel("typing_status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_status",
        },
        () => {
          loadTypingStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const loadTypingStatus = async () => {
    const { data } = await supabase
      .from("typing_status")
      .select(`
        *,
        profiles (username)
      `)
      .eq("is_typing", true)
      .neq("profile_id", profileId || "");

    if (data) {
      setTypingUsers(data);
    }
  };

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm animate-fade-in">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-typing rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-typing rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-typing rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>
        {typingUsers.map((u) => u.profiles?.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
};