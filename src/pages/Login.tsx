import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Brain, Shield, User, ArrowLeft, Sparkles, Zap, Globe, Image, Ban, Mail, MessageSquare, MailCheck, RefreshCw, Eye, EyeOff } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const features = [
  { icon: Zap, label: "AI Chat", desc: "Smart conversations", delay: "0s" },
  { icon: Globe, label: "Live News", desc: "Real-time updates", delay: "0.1s" },
  { icon: Image, label: "Image Gen", desc: "AI art creation", delay: "0.2s" },
  { icon: Sparkles, label: "OCR Tool", desc: "Image to text", delay: "0.3s" },
];

// ─── Email Verification Screen ───
const EmailVerificationScreen = ({ email, onResend, onLogout }: { email: string; onResend: () => void; onLogout: () => void }) => {
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await onResend();
      toast.success("Verification email sent! Check your inbox 📧");
      setCountdown(60);
    } catch {
      toast.error("Too many attempts. Try later.");
    }
    setResending(false);
  };

  return (
    <div className="space-y-5 py-2 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center border border-primary/20 animate-[bounce_2s_ease-in-out_infinite]">
        <MailCheck className="w-8 h-8 text-primary" />
      </div>
      <div className="animate-slide-up">
        <h3 className="text-lg font-bold text-foreground font-display">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground mt-2">
          We've sent a verification link to
        </p>
        <p className="text-sm font-medium text-primary mt-1 break-all">{email}</p>
        <p className="text-xs text-muted-foreground mt-2">Check your inbox (& spam) and click the link.</p>
      </div>

      <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
        <Button onClick={handleResend} disabled={resending || countdown > 0} variant="outline" className="w-full gap-2 h-11 transition-all hover:border-primary/50 hover:bg-primary/5">
          <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
          {countdown > 0 ? `Resend in ${countdown}s` : resending ? "Sending..." : "Resend Verification Email"}
        </Button>
        <Button onClick={() => window.location.reload()} className="w-full gap-2 h-11 bg-primary text-primary-foreground hover:bg-primary/80">
          <MailCheck className="w-4 h-4" /> I've Verified — Continue
        </Button>
        <button onClick={onLogout} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2 group">
          <span className="group-hover:-translate-x-1 inline-block transition-transform">←</span> Use different account
        </button>
      </div>
    </div>
  );
};

// ─── Main Login Component ───
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [banInfo, setBanInfo] = useState<{ reason: string; permanent: boolean; expiresAt: string | null } | null>(null);
  const { user, login, signup, resetPassword, logout, resendVerification } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.emailVerified) {
      navigate("/dashboard");
    } else if (user && !user.emailVerified) {
      setNeedsVerification(true);
    }
  }, [user]);

  const checkBanStatus = async (userEmail: string): Promise<{ banned: boolean; reason: string; permanent: boolean; expiresAt: string | null }> => {
    try {
      const bansRef = collection(db, "user_bans");
      const q = query(bansRef, where("userEmail", "==", userEmail.toLowerCase()));
      const snap = await getDocs(q);
      const now = new Date();
      for (const d of snap.docs) {
        const ban = d.data();
        if (!ban.active) continue;
        if (!ban.expiresAt) return { banned: true, reason: ban.reason || "Banned by admin", permanent: true, expiresAt: null };
        if (ban.expiresAt.toDate() > now) return { banned: true, reason: ban.reason || "Banned by admin", permanent: false, expiresAt: ban.expiresAt.toDate().toLocaleString() };
      }
    } catch (err) { console.error("Ban check error:", err); }
    return { banned: false, reason: "", permanent: false, expiresAt: null };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Please fill in both Email and Password"); return; }
    setLoading(true);
    setBanInfo(null);
    try {
      await login(email, password);
      const ban = await checkBanStatus(email.trim());
      if (ban.banned) {
        await logout();
        setBanInfo({ reason: ban.reason, permanent: ban.permanent, expiresAt: ban.expiresAt });
        setLoading(false);
        return;
      }
      const { currentUser } = await import("firebase/auth").then(m => ({ currentUser: m.getAuth().currentUser }));
      if (currentUser && !currentUser.emailVerified) {
        setNeedsVerification(true);
        setLoading(false);
        return;
      }
      toast.success("Login successful! 🚀");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Please fill in both Email and Password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    setLoading(true);
    try {
      await signup(email, password, name.trim());
      toast.success("Account created! Verification email sent 📧");
      setNeedsVerification(true);
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("Password reset email sent! Check your inbox 📧");
      setForgotMode(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden cyber-grid">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/3 blur-[80px] animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center relative z-10">
        {/* Left — Branding */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium animate-slide-up">
            <Sparkles className="w-3 h-3 animate-[spin_3s_linear_infinite]" /> Powered by AI
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
            <span className="gradient-text">AI HUB</span>
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-md mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            Your intelligent command center — chat with AI, generate images, get live news & weather.
          </p>
          
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto lg:mx-0">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 p-3 rounded-xl glass-card-hover group animate-slide-up"
                style={{ animationDelay: f.delay, animationFillMode: "both" }}
              >
                <div className="w-9 h-9 rounded-lg gradient-bg-strong flex items-center justify-center shrink-0 group-hover:neon-border transition-all duration-300">
                  <f.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating stats */}
          <div className="flex items-center gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/30 border border-border text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              20+ AI Tools
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/30 border border-border text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.5s" }} />
              Free to Use
            </div>
          </div>
        </div>

        {/* Right — Auth Card */}
        <Card className="w-full max-w-md glass-card neon-border animate-scale-in overflow-hidden">
          {/* Animated top gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-accent animate-[shimmer_3s_ease-in-out_infinite]" />
          
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl gradient-bg-strong flex items-center justify-center neon-border animate-glow-pulse">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl gradient-text">
                {needsVerification ? "Almost There!" : "Welcome Back"}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {needsVerification ? "Just one more step" : "Sign in to access your hub"}
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            {needsVerification ? (
              <EmailVerificationScreen
                email={user?.email || email}
                onResend={resendVerification}
                onLogout={async () => { await logout(); setNeedsVerification(false); }}
              />
            ) : banInfo ? (
              <div className="space-y-5 animate-fade-in py-2">
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mb-4 border border-destructive/20 animate-[shake_0.5s_ease-in-out]">
                    <Ban className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-destructive font-display">Account Banned</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {banInfo.permanent ? "Your account is permanently banned." : `Banned until ${banInfo.expiresAt}`}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                  <p className="text-[11px] text-muted-foreground mb-1 font-medium">Reason:</p>
                  <p className="text-sm text-foreground">{banInfo.reason}</p>
                </div>
                <div className="space-y-2">
                  <a href="mailto:typeforyou11@gmail.com?subject=Ban%20Appeal%20-%20AI%20Hub" className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-all text-sm font-medium border border-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                    <Mail className="w-4 h-4" /> Contact Admin
                  </a>
                  <a href="https://www.instagram.com/_lakshhh__18/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-muted/30 text-foreground hover:bg-muted/50 transition-all text-sm font-medium border border-border hover:scale-[1.02] active:scale-[0.98]">
                    <MessageSquare className="w-4 h-4" /> Contact Us (Instagram)
                  </a>
                </div>
                <button onClick={() => setBanInfo(null)} className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2">
                  ← Back to Login
                </button>
              </div>
            ) : forgotMode ? (
              <div className="space-y-4 animate-fade-in">
                <button onClick={() => setForgotMode(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
                </button>
                <h3 className="text-lg font-semibold text-foreground font-display">Reset Password</h3>
                <p className="text-sm text-muted-foreground">Enter your email and we'll send you a password reset link.</p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/30 border-border focus:border-primary h-11 transition-all duration-200" />
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/80 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="animate-fade-in">
                <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-11">
                  <TabsTrigger value="login" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium transition-all duration-200">
                    <Shield className="w-4 h-4" /> Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary font-medium transition-all duration-200">
                    <User className="w-4 h-4" /> Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="animate-fade-in">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/30 border-border focus:border-primary h-11 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" />
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-muted/30 border-border focus:border-primary h-11 pr-10 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/80 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Logging in...
                        </span>
                      ) : "Login →"}
                    </Button>
                    <button type="button" onClick={() => setForgotMode(true)} className="w-full text-center text-sm text-primary/80 hover:text-primary transition-colors hover:underline">
                      Forgot Password?
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="animate-fade-in">
                  <form onSubmit={handleSignup} className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <Input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/30 border-border focus:border-primary h-11 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" />
                      <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/30 border-border focus:border-primary h-11 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" />
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-muted/30 border-border focus:border-primary h-11 pr-10 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-[0_0_20px_hsl(var(--secondary)/0.3)]">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </span>
                      ) : "Create Account →"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
