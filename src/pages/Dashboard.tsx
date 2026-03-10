import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import AIChat from "@/components/AIChat";
import NewsPage from "@/pages/NewsPage";
import WeatherPage from "@/pages/WeatherPage";
import SourceCode from "@/pages/SourceCode";
import ProfilePage from "@/pages/ProfilePage";
import ImageGenerator from "@/pages/ImageGenerator";
import TranslatorPage from "@/pages/TranslatorPage";
import NotesPage from "@/pages/NotesPage";
import BackgroundRemover from "@/pages/BackgroundRemover";
import PDFChat from "@/pages/PDFChat";
import QRCodeGenerator from "@/pages/QRCodeGenerator";
import CodeGenerator from "@/pages/CodeGenerator";
import MusicGenerator from "@/pages/MusicGenerator";
import URLShortener from "@/pages/URLShortener";
import PythonRunner from "@/pages/PythonRunner";
import TicTacToe from "@/pages/TicTacToe";
import SnakeGame from "@/pages/SnakeGame";
import MemoryGame from "@/pages/MemoryGame";
import CricketScorecard from "@/pages/CricketScorecard";
import InstallPage from "@/pages/InstallPage";
import AboutPage from "@/pages/AboutPage";
import FeedbackPage from "@/pages/FeedbackPage";
import AdminPanel from "@/components/AdminPanel";
import AnnouncementsBanner from "@/components/AnnouncementsBanner";
import { Brain, LogOut, Shield, Ban, Mail, MessageSquare } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useModeration } from "@/contexts/ModerationContext";

const Dashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { isCurrentUserBanned, getBanExpiry, isBanPermanent } = useModeration();

  const banned = isCurrentUserBanned();
  const banExpiry = getBanExpiry();
  const permanent = isBanPermanent();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Banned user sees ONLY the ban screen (admin still gets full access)
  if (banned && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 cyber-grid">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-destructive/5 blur-[120px] animate-float" />
        </div>
        <div className="w-full max-w-md relative z-10 space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-destructive/15 flex items-center justify-center mb-5 border border-destructive/20">
              <Ban className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive font-display">Account Banned</h1>
            <p className="text-muted-foreground mt-2">
              {permanent
                ? "Your account has been permanently banned."
                : `Your ban expires at ${banExpiry?.toLocaleString()}`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/15 text-center">
            <p className="text-sm text-foreground">You cannot access any features while banned.</p>
          </div>

          <div className="space-y-2">
            <a
              href="mailto:typeforyou11@gmail.com?subject=Ban%20Appeal%20-%20AI%20Hub"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-all text-sm font-medium border border-primary/20"
            >
              <Mail className="w-4 h-4" /> Contact Admin
            </a>
            <a
              href="https://www.instagram.com/_lakshhh__18/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-muted/30 text-foreground hover:bg-muted/50 transition-all text-sm font-medium border border-border"
            >
              <MessageSquare className="w-4 h-4" /> Contact Us (Instagram)
            </a>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background cyber-grid">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-50 glass-card border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
                <div className="w-9 h-9 rounded-xl gradient-bg-strong flex items-center justify-center neon-border">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text font-display tracking-wider">AI HUB</h1>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">{user?.email}</p>
                </div>
                {isAdmin && (
                  <span className="ml-2 px-2.5 py-1 text-[10px] rounded-full bg-accent/15 text-accent flex items-center gap-1 border border-accent/20 font-semibold uppercase tracking-wider">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline text-sm">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 space-y-4">
            <AnnouncementsBanner />
            {isAdmin && <AdminPanel />}

            <div className="animate-fade-in">
              <Routes>
                <Route index element={<AIChat />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="weather" element={<WeatherPage />} />
                <Route path="source-code" element={<SourceCode />} />
                <Route path="image-gen" element={<ImageGenerator />} />
                <Route path="translator" element={<TranslatorPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="bg-remover" element={<BackgroundRemover />} />
                <Route path="pdf-chat" element={<PDFChat />} />
                <Route path="music-gen" element={<MusicGenerator />} />
                <Route path="qr-gen" element={<QRCodeGenerator />} />
                <Route path="code-gen" element={<CodeGenerator />} />
                <Route path="python" element={<PythonRunner />} />
                <Route path="url-short" element={<URLShortener />} />
                <Route path="tic-tac-toe" element={<TicTacToe />} />
                <Route path="snake" element={<SnakeGame />} />
                <Route path="memory" element={<MemoryGame />} />
                <Route path="cricket" element={<CricketScorecard />} />
                <Route path="install" element={<InstallPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
