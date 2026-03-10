import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Send, MessageSquare, User, Shield, Reply, TrendingUp, Heart, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Feedback {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  rating: number;
  message: string;
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
}

const StarRating = ({ rating, onRate, interactive = true, size = "md" }: { rating: number; onRate?: (r: number) => void; interactive?: boolean; size?: "sm" | "md" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => interactive && onRate?.(star)}
        disabled={!interactive}
        className={`transition-all duration-200 ${interactive ? "hover:scale-125 cursor-pointer hover:rotate-12" : "cursor-default"}`}
      >
        <Star className={`${size === "sm" ? "w-4 h-4" : "w-6 h-6"} transition-colors duration-200 ${star <= rating ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]" : "text-muted-foreground/20"}`} />
      </button>
    ))}
  </div>
);

const FeedbackPage = () => {
  const { user, isAdmin } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setFeedbacks(data as unknown as Feedback[]);
  };

  useEffect(() => {
    fetchFeedbacks();
    const channel = supabase
      .channel("feedback-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => fetchFeedbacks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const submitFeedback = async () => {
    if (!rating || !message.trim()) { toast.error("Please add rating and message"); return; }
    setLoading(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.uid || "anonymous",
      user_email: user?.email || "unknown",
      user_name: user?.displayName || null,
      rating,
      message: message.trim(),
    } as any);
    if (error) toast.error("Failed to submit feedback");
    else { toast.success("Feedback submitted! ⭐"); setRating(0); setMessage(""); }
    setLoading(false);
  };

  const submitReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("feedback")
      .update({ admin_reply: replyText.trim(), admin_reply_at: new Date().toISOString() } as any)
      .eq("id", feedbackId);
    if (error) toast.error("Failed to reply");
    else { toast.success("Reply sent! ✅"); setReplyingTo(null); setReplyText(""); }
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0";
  
  const happyUsers = feedbacks.filter(f => f.rating >= 4).length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: feedbacks.filter(f => f.rating === r).length,
    pct: feedbacks.length > 0 ? (feedbacks.filter(f => f.rating === r).length / feedbacks.length) * 100 : 0
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up">
        {[
          { value: avgRating, label: "Avg Rating", icon: Star, color: "text-yellow-400" },
          { value: feedbacks.length, label: "Total Reviews", icon: MessageSquare, color: "text-primary" },
          { value: happyUsers, label: "Happy Users", icon: Heart, color: "text-accent" },
        ].map((stat, i) => (
          <Card key={stat.label} className="glass-card p-4 text-center group hover:neon-border transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "both" }}>
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
            <p className="text-2xl font-bold gradient-text font-display">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Rating Distribution */}
      <Card className="glass-card animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Rating Distribution</p>
          </div>
          <div className="space-y-2">
            {ratingDistribution.map((r) => (
              <div key={r.stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{r.stars}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground">{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Feedback */}
      <Card className="glass-card neon-border animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display gradient-text flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Give Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3 p-4 rounded-xl bg-muted/10 border border-border">
            <p className="text-sm text-muted-foreground">How would you rate AI Hub?</p>
            <StarRating rating={rating} onRate={setRating} />
            {rating > 0 && (
              <p className="text-xs text-primary animate-fade-in font-medium">
                {rating === 5 ? "Excellent! 🌟" : rating === 4 ? "Great! 😊" : rating === 3 ? "Good 👍" : rating === 2 ? "Fair 😐" : "Poor 😕"}
              </p>
            )}
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your experience, suggestions, or feedback..."
            className="bg-muted/20 border-border min-h-[80px] text-sm transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
          />
          <Button
            onClick={submitFeedback}
            disabled={loading || !rating || !message.trim()}
            className="w-full gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          >
            <Send className="w-4 h-4" /> Submit Feedback
          </Button>
        </CardContent>
      </Card>

      {/* All Reviews */}
      <Card className="glass-card animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display gradient-text flex items-center gap-2">
            <Star className="w-4 h-4" /> All Reviews ({feedbacks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px] pr-2">
            <div className="space-y-4">
              {feedbacks.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <ThumbsUp className="w-10 h-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
                </div>
              )}
              {feedbacks.map((fb, i) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-muted/10 border border-border space-y-3 hover:border-primary/20 transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{fb.user_name || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <StarRating rating={fb.rating} interactive={false} size="sm" />
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed">{fb.message}</p>

                  {/* Admin Reply */}
                  {fb.admin_reply && (
                    <div className="ml-6 p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1 animate-fade-in">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold text-primary">Developer Reply</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">
                          {fb.admin_reply_at && new Date(fb.admin_reply_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70">{fb.admin_reply}</p>
                    </div>
                  )}

                  {/* Admin Reply Button */}
                  {isAdmin && !fb.admin_reply && (
                    <>
                      {replyingTo === fb.id ? (
                        <div className="ml-6 space-y-2 animate-fade-in">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="text-sm bg-muted/20 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => submitReply(fb.id)} disabled={!replyText.trim()} className="gap-1 text-xs hover:scale-105 active:scale-95 transition-transform">
                              <Send className="w-3 h-3" /> Reply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }} className="text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(fb.id)}
                          className="ml-6 flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-all hover:translate-x-1"
                        >
                          <Reply className="w-3 h-3" /> Reply as Admin
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPage;
