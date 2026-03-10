import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Shield, Save, KeyRound, Calendar } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, isAdmin, resetPassword } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const initials = (user?.displayName || user?.email || "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    try {
      await resetPassword(user.email);
      toast.success("Password reset email sent!");
    } catch {
      toast.error("Failed to send reset email");
    }
    setResetting(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg gradient-bg-strong flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="gradient-text font-display text-base tracking-wide">My Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20 animate-glow-pulse">
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold font-display">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5" /> Email
            </Label>
            <Input value={user?.email || ""} disabled className="bg-muted/20 h-11" />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
              <User className="w-3.5 h-3.5" /> Display Name
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="bg-muted/20 h-11"
            />
          </div>

          {/* Created */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Member Since
            </Label>
            <Input
              value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
              disabled
              className="bg-muted/20 h-11"
            />
          </div>

          {/* Role badge */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-semibold">Admin Access</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="w-full h-11">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting}
              variant="outline"
              className="w-full h-11 border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {resetting ? "Sending..." : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
