import { Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Profile {
  id: string;
  username: string;
  is_online: boolean;
}

interface OnlineUsersProps {
  users: Profile[];
  currentUsername: string;
}

export const OnlineUsers = ({ users, currentUsername }: OnlineUsersProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">
            Online ({users.length})
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="w-2 h-2 bg-online rounded-full animate-pulse" />
              <span className="text-sm text-sidebar-foreground">
                {user.username}
                {user.username === currentUsername && (
                  <span className="text-xs text-muted-foreground ml-1">(you)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};