import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.trim())
        .single();

      let profileId;

      if (existingProfile) {
        profileId = existingProfile.id;
        // Update online status
        await supabase
          .from("profiles")
          .update({ is_online: true })
          .eq("id", profileId);
      } else {
        // Create new profile
        const { data: newProfile, error } = await supabase
          .from("profiles")
          .insert([{ username: username.trim(), is_online: true }])
          .select()
          .single();

        if (error) throw error;
        profileId = newProfile.id;
      }

      // Store profile ID in localStorage
      localStorage.setItem("arattai_profile_id", profileId);
      localStorage.setItem("arattai_username", username.trim());

      navigate("/chat");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-primary p-4 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Arattai 2.0
          </h1>
          <p className="text-muted-foreground text-lg">
            Join the conversation
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 text-lg bg-card border-border"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? "Joining..." : "Join Chat"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Enter any username to start chatting instantly
        </p>
      </div>
    </div>
  );
};

export default Login;