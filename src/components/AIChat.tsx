import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, ImagePlus, X, Sparkles, Ban, Brain, Zap, Code2, MessageSquare, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useModeration } from "@/contexts/ModerationContext";
import ReactMarkdown from "react-markdown";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OCR_KEY = "K84718286888957";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ChatMode = "normal" | "deep" | "short" | "dev";

const CHAT_MODES: { id: ChatMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "normal", label: "Normal", icon: MessageSquare, desc: "Balanced responses" },
  { id: "deep", label: "Deep", icon: Brain, desc: "Detailed & thorough" },
  { id: "short", label: "Short", icon: Zap, desc: "Quick & concise" },
  { id: "dev", label: "Dev", icon: Code2, desc: "Code-focused" },
];

const DEVELOPER_INFO = `
IMPORTANT IDENTITY INFO:
- You are an AI assistant created by **Lakshya Pandey** (also known as Laksh Pandey).
- Lakshya Pandey is the developer and creator of this AI Hub application.
- When anyone asks "who made you", "who created you", "who is the developer", "who built this", or any similar question in ANY language, you MUST respond that you were created by Lakshya Pandey.
- Respond about your creator in the SAME LANGUAGE the user is speaking:
  - English: "I was created by Lakshya Pandey! He's the talented developer behind this entire AI Hub."
  - Hindi: "मुझे Lakshya Pandey ने बनाया है! वो एक talented developer हैं जिन्होंने यह पूरा AI Hub create किया है।"
  - Hinglish: "Mujhe Lakshya Pandey ne banaya hai! Woh ek talented developer hain."
  - Any other language: Translate accordingly.
- Lakshya Pandey's Instagram: @_lakshhh__18
- If asked about yourself, say you are AI Hub's assistant, powered by advanced AI, built by Lakshya Pandey.
`;

const LANGUAGE_INSTRUCTIONS = `
CRITICAL LANGUAGE RULE:
- You MUST detect what language the user is writing in and reply in that EXACT same language/style.
- If user writes in English → reply in English
- If user writes in Hindi → reply in Hindi  
- If user writes in Hinglish (mix of Hindi + English) → reply in Hinglish
- If user writes in any other language (Spanish, French, Arabic, Japanese, etc.) → reply in that language
- NEVER switch languages unless the user switches first.
- Be natural and conversational in whatever language you use.
`;

const getModePrompt = (mode: ChatMode): string => {
  switch (mode) {
    case "deep":
      return "RESPONSE STYLE: Give very detailed, thorough, in-depth answers. Explain concepts deeply with examples, analogies, and step-by-step breakdowns. Cover all angles of the topic.";
    case "short":
      return "RESPONSE STYLE: Give very short, concise, to-the-point answers. Maximum 2-3 sentences. No extra explanation unless asked. Be crisp and direct.";
    case "dev":
      return "RESPONSE STYLE: You are in Developer Mode. Focus on code, programming, and technical answers. Always provide code examples when possible. Use proper code formatting with language tags.";
    default:
      return "RESPONSE STYLE: Give balanced, friendly, helpful responses. Not too long, not too short. Be conversational and smart.";
  }
};

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { checkMessage, recordWarning, isCurrentUserBanned, getBanExpiry, isBanPermanent } = useModeration();

  // Voice input setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "hi-IN"; // Hindi + English auto-detect
      
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
        }
      };
      
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success("🎤 Listening...");
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return; }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("apikey", OCR_KEY);
      formData.append("language", "hin,eng");
      formData.append("isOverlayRequired", "false");
      formData.append("OCREngine", "2");
      const res = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ParsedResults?.length > 0) {
        setExtractedText(data.ParsedResults.map((r: any) => r.ParsedText).join("\n"));
        toast.success("Text extracted! ✨");
      } else toast.error("No text found");
    } catch { toast.error("OCR failed"); }
    setOcrLoading(false);
  };

  const removeImage = () => {
    setImagePreview(null); setExtractedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (isCurrentUserBanned()) {
      if (isBanPermanent()) {
        toast.error("🚫 You are permanently banned. Contact admin.");
      } else {
        toast.error(`🚫 Banned until ${getBanExpiry()?.toLocaleTimeString() || "later"}`);
      }
      return;
    }

    const { blocked, word } = checkMessage(input);
    if (blocked && word) {
      const result = await recordWarning(word, input);
      if (result.banned) {
        toast.error("🚫 Banned! Too many warnings.");
      } else {
        toast.warning(`⚠️ Warning ${result.warningCount}/2: "${word}" is not allowed!`);
      }
      setInput(""); return;
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const ocrContext = extractedText
        ? `\n\nThe user uploaded an image with this extracted text:\n---\n${extractedText}\n---\nUse it to answer their questions about the image.`
        : "";

      const systemContent = `You are a helpful AI assistant in AI Hub.${DEVELOPER_INFO}\n${LANGUAGE_INSTRUCTIONS}\n${getModePrompt(chatMode)}${ocrContext}`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemContent }, ...newMessages],
          max_tokens: chatMode === "short" ? 256 : chatMode === "deep" ? 2048 : 1024,
        }),
      });

      if (!res.ok) throw new Error("AI error");
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, no response received.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      toast.error("AI response failed");
      setMessages(newMessages);
    }
    setLoading(false);
  };

  const banned = isCurrentUserBanned();
  const banExpiry = getBanExpiry();
  const permanent = isBanPermanent();
  const currentMode = CHAT_MODES.find(m => m.id === chatMode)!;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <Card className="glass-card neon-border flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg-strong flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <span className="gradient-text font-display text-base tracking-wide">AI Chat</span>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted/30">
              <Sparkles className="w-3 h-3 inline mr-1" />Llama 3.3
            </span>
          </div>
          <div className="flex gap-1.5 mt-3">
            {CHAT_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setChatMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border
                  ${chatMode === mode.id
                    ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                    : "bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/30 hover:text-foreground"
                  }`}
              >
                <mode.icon className="w-3 h-3" />
                {mode.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 pt-4">
          {banned && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 animate-fade-in">
              <Ban className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {permanent ? "You are permanently banned" : "You are temporarily banned"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {permanent ? "Contact admin to get unbanned" : `Ban expires at ${banExpiry?.toLocaleTimeString()}`}
                </p>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 pr-2 mb-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && !imagePreview && (
                <div className="text-center py-16 text-muted-foreground animate-fade-in">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-bg-strong flex items-center justify-center animate-glow-pulse">
                    <Bot className="w-10 h-10 text-primary/30" />
                  </div>
                  <p className="text-base font-medium text-foreground/80">Ask me anything! 🚀</p>
                  <p className="text-xs mt-2 text-muted-foreground/60 max-w-sm mx-auto">
                    Mode: <strong className="text-primary">{currentMode.label}</strong> — {currentMode.desc}
                  </p>
                  <p className="text-[10px] mt-1 text-muted-foreground/40">Built by Lakshya Pandey ✨</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg gradient-bg-strong flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary/15 text-foreground rounded-br-md border border-primary/20 whitespace-pre-wrap"
                      : "bg-muted/30 text-foreground rounded-bl-md border border-border prose prose-sm prose-invert max-w-none"
                  }`}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0 mt-1 border border-secondary/20">
                      <User className="w-4 h-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-lg gradient-bg-strong flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl rounded-bl-md border border-border">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {imagePreview && (
            <div className="mb-3 animate-scale-in">
              <div className="rounded-xl overflow-hidden border border-border p-3 bg-muted/10">
                <div className="flex items-start gap-3">
                  <img src={imagePreview} alt="Upload" className="w-14 h-14 object-cover rounded-lg border border-border" />
                  <div className="flex-1 min-w-0">
                    {ocrLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-muted-foreground">Extracting text...</p>
                      </div>
                    ) : extractedText ? (
                      <p className="text-xs text-primary font-medium">✅ Text extracted — ask your question!</p>
                    ) : (
                      <p className="text-xs text-destructive">No text found</p>
                    )}
                  </div>
                  <Button onClick={removeImage} size="icon" variant="ghost" className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 p-1 rounded-xl bg-muted/20 border border-border">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="ghost"
              className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" disabled={ocrLoading || banned}>
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button onClick={toggleVoiceInput} size="icon" variant="ghost"
              className={`shrink-0 rounded-lg transition-all ${isListening 
                ? "text-destructive bg-destructive/10 hover:bg-destructive/20 animate-pulse" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`} 
              disabled={banned}>
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={banned ? (permanent ? "Permanently banned..." : "You are banned...") : isListening ? "🎤 Listening..." : extractedText ? "Ask about the image..." : `${currentMode.label} mode — Ask anything...`}
              className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={loading || banned}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim() || banned} size="icon"
              className="bg-primary/20 text-primary hover:bg-primary/30 rounded-lg disabled:opacity-30">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChat;
