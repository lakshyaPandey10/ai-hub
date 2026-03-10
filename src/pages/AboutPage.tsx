import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Code2, Sparkles, Brain, Zap, Shield, Globe, Instagram, Mail, Heart } from "lucide-react";

const features = [
  { icon: Bot, title: "AI Chat", desc: "Llama 3.3 powered chatbot with multiple modes — Normal, Deep, Short & Dev" },
  { icon: Sparkles, title: "Image Generator", desc: "AI-powered image generation from text prompts" },
  { icon: Brain, title: "PDF Chat", desc: "Chat with your PDF documents using AI" },
  { icon: Code2, title: "Code Playground", desc: "Write & run HTML/CSS/JS code in real-time" },
  { icon: Zap, title: "Music Generator", desc: "AI-composed music using Web Audio synthesis" },
  { icon: Globe, title: "Translator", desc: "AI-powered multi-language translation" },
  { icon: Shield, title: "BG Remover", desc: "Remove backgrounds from images instantly" },
  { icon: Bot, title: "Python Runner", desc: "Run Python code with AI assistance" },
];

const AboutPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <Card className="glass-card neon-border overflow-hidden">
        <CardContent className="p-6 md:p-8 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-bg-strong flex items-center justify-center animate-glow-pulse">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text font-display">AI HUB</h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Your all-in-one AI-powered command center. Chat, generate images, create music, write code, 
            translate languages, and much more — all in one beautiful app.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">v2.0</span>
            <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">PWA</span>
            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">Free</span>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display gradient-text flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Features
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border hover:border-primary/20 transition-all">
              <div className="w-8 h-8 rounded-lg gradient-bg-strong flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display gradient-text flex items-center gap-2">
            <Code2 className="w-4 h-4" /> Tech Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "React + TypeScript + Vite",
            "Tailwind CSS + shadcn/ui",
            "Firebase Authentication",
            "Groq AI (Llama 3.3 70B)",
            "Supabase Edge Functions",
            "PWA (Progressive Web App)",
          ].map((tech, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {tech}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Creator */}
      <Card className="glass-card neon-border-purple">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-secondary/15 flex items-center justify-center border border-secondary/20">
            <Heart className="w-7 h-7 text-secondary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground font-display">Lakshya Pandey</p>
            <p className="text-xs text-muted-foreground">Creator & Developer</p>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Built with passion and love. AI Hub is designed to bring powerful AI tools to everyone, for free. 
            Your feedback helps make it better every day!
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="https://www.instagram.com/_lakshhh__18/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
            <a href="mailto:typeforyou11@gmail.com"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;
    
