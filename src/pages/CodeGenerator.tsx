import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Play, Copy, Check, Loader2, Sparkles, Eye, FileCode } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  { value: "blank", label: "Blank", html: "", css: "", js: "" },
  {
    value: "landing", label: "🚀 Landing Page",
    html: `<div class="hero">\n  <h1>Welcome to My Site</h1>\n  <p>A beautiful landing page</p>\n  <button class="btn">Get Started</button>\n</div>`,
    css: `.hero { text-align: center; padding: 80px 20px; font-family: sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }\nh1 { font-size: 3em; margin-bottom: 10px; }\np { font-size: 1.2em; opacity: 0.9; }\n.btn { margin-top: 20px; padding: 12px 32px; border: 2px solid white; background: transparent; color: white; font-size: 1em; border-radius: 30px; cursor: pointer; transition: all 0.3s; }\n.btn:hover { background: white; color: #764ba2; }`,
    js: `document.querySelector('.btn').addEventListener('click', () => {\n  alert('Welcome! 🎉');\n});`,
  },
  {
    value: "card", label: "🃏 Profile Card",
    html: `<div class="card">\n  <div class="avatar">👤</div>\n  <h2>John Doe</h2>\n  <p class="role">Full Stack Developer</p>\n  <div class="stats">\n    <div><strong>120</strong><span>Projects</span></div>\n    <div><strong>45k</strong><span>Followers</span></div>\n    <div><strong>98%</strong><span>Success</span></div>\n  </div>\n</div>`,
    css: `body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0f0f1a; margin: 0; font-family: sans-serif; }\n.card { background: #1a1a2e; border-radius: 20px; padding: 40px; text-align: center; color: white; box-shadow: 0 20px 60px rgba(0,0,0,0.5); width: 320px; }\n.avatar { font-size: 60px; margin-bottom: 15px; }\nh2 { margin: 0; font-size: 1.5em; }\n.role { color: #888; margin: 5px 0 20px; }\n.stats { display: flex; justify-content: space-around; border-top: 1px solid #333; padding-top: 20px; }\n.stats div { text-align: center; }\n.stats strong { display: block; font-size: 1.3em; color: #667eea; }\n.stats span { font-size: 0.75em; color: #666; }`,
    js: "",
  },
  {
    value: "clock", label: "⏰ Live Clock",
    html: `<div class="clock-container">\n  <div class="clock" id="clock">00:00:00</div>\n  <p class="date" id="date"></p>\n</div>`,
    css: `body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; margin: 0; font-family: 'Courier New', monospace; }\n.clock-container { text-align: center; }\n.clock { font-size: 5em; color: #00ff88; text-shadow: 0 0 20px rgba(0,255,136,0.5); letter-spacing: 5px; }\n.date { color: #555; font-size: 1.2em; margin-top: 10px; }`,
    js: `function updateClock() {\n  const now = new Date();\n  document.getElementById('clock').textContent = now.toLocaleTimeString();\n  document.getElementById('date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });\n}\nupdateClock();\nsetInterval(updateClock, 1000);`,
  },
];

const CodeGenerator = () => {
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [activeTab, setActiveTab] = useState("html");
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState("blank");

  const getPreviewDoc = () => {
    return `<!DOCTYPE html>
<html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
  };

  const handleRun = () => {
    setPreviewKey((k) => k + 1);
    toast.success("Code running!");
  };

  const handleTemplate = (value: string) => {
    setTemplate(value);
    const t = TEMPLATES.find((t) => t.value === value);
    if (t) {
      setHtml(t.html);
      setCss(t.css);
      setJs(t.js);
      setPreviewKey((k) => k + 1);
      if (value !== "blank") toast.success(`${t.label} template loaded!`);
    }
  };

  const handleCopyAll = () => {
    const full = getPreviewDoc();
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Full code copied!");
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([getPreviewDoc()], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `code-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("HTML file downloaded!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Card className="glass-card neon-border-purple">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Code2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <span className="gradient-text-pink font-display text-base tracking-wide">Code Playground</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Write HTML, CSS, JS with live preview</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Template</label>
              <Select value={template} onValueChange={handleTemplate}>
                <SelectTrigger className="h-9 bg-background/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-5">
              <Button onClick={handleRun} className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 h-9 text-sm">
                <Play className="w-3.5 h-3.5 mr-1" /> Run
              </Button>
              <Button onClick={handleCopyAll} variant="outline" className="h-9 text-sm px-3">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button onClick={handleDownloadHTML} variant="outline" className="h-9 text-sm px-3">
                <FileCode className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="html" className="text-xs">HTML</TabsTrigger>
                  <TabsTrigger value="css" className="text-xs">CSS</TabsTrigger>
                  <TabsTrigger value="js" className="text-xs">JS</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-2">
                  <Textarea value={html} onChange={(e) => setHtml(e.target.value)}
                    placeholder="<h1>Hello World</h1>"
                    className="font-mono text-xs bg-muted/10 border-border min-h-[300px] resize-none" />
                </TabsContent>
                <TabsContent value="css" className="mt-2">
                  <Textarea value={css} onChange={(e) => setCss(e.target.value)}
                    placeholder="body { color: white; }"
                    className="font-mono text-xs bg-muted/10 border-border min-h-[300px] resize-none" />
                </TabsContent>
                <TabsContent value="js" className="mt-2">
                  <Textarea value={js} onChange={(e) => setJs(e.target.value)}
                    placeholder="console.log('Hello!');"
                    className="font-mono text-xs bg-muted/10 border-border min-h-[300px] resize-none" />
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" /> Live Preview
              </div>
              <div className="rounded-xl border border-border overflow-hidden bg-white min-h-[300px]">
                <iframe key={previewKey} srcDoc={getPreviewDoc()} title="Preview"
                  className="w-full h-[320px] border-0" sandbox="allow-scripts" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeGenerator;
