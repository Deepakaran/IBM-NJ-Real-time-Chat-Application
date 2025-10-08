import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { MessageInput } from "@/components/chat/MessageInput";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface Message {
  id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface Profile {
  id: string;
  username: string;
  is_online: boolean;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const profileId = localStorage.getItem("arattai_profile_id");
    const username = localStorage.getItem("arattai_username");

    if (!profileId || !username) {
      navigate("/");
      return;
    }

    setCurrentProfileId(profileId);
    setCurrentUsername(username);

    // Load initial messages
    loadMessages();

    // Load online users
    loadOnlineUsers();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    // Subscribe to profile changes (online status)
    const profilesChannel = supabase
      .channel("profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          loadOnlineUsers();
        }
      )
      .subscribe();

    // Update online status on mount
    updateOnlineStatus(profileId, true);

    // Set up beforeunload handler
    const handleBeforeUnload = () => {
      updateOnlineStatus(profileId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      updateOnlineStatus(profileId, false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        profiles (username)
      `)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const loadOnlineUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_online", true)
      .order("username");

    if (data) {
      setOnlineUsers(data);
    }
  };

  const updateOnlineStatus = async (profileId: string, isOnline: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_online: isOnline })
      .eq("id", profileId);
  };

  const handleLogout = async () => {
    if (currentProfileId) {
      await updateOnlineStatus(currentProfileId, false);
    }
    localStorage.removeItem("arattai_profile_id");
    localStorage.removeItem("arattai_username");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-bold text-sidebar-foreground">Arattai 2.0</h2>
          </div>
        </div>

        <OnlineUsers users={onlineUsers} currentUsername={currentUsername} />

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="text-sm text-sidebar-foreground mb-2">
            Logged in as <span className="font-semibold">{currentUsername}</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-card border-b border-border flex items-center px-6">
          <h1 className="text-xl font-semibold">General Chat</h1>
          <div className="ml-auto text-sm text-muted-foreground">
            {onlineUsers.length} {onlineUsers.length === 1 ? "user" : "users"} online
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.profile_id === currentProfileId}
            />
          ))}
          <TypingIndicator profileId={currentProfileId} />
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput profileId={currentProfileId} />
      </div>
    </div>
  );
};

export default Chat;