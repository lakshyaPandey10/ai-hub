import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Upload, Send, Loader2, Sparkles, Trash2, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PDFChat = () => {
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const extractText = async (file: File) => {
    setExtracting(true);
    try {
      // Use pdf.js-like approach via FileReader for text extraction
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // Simple text extraction from PDF binary
          const bytes = new Uint8Array(arrayBuffer);
          let str = "";
          for (let i = 0; i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
          }
          
          // Extract text between stream/endstream markers (basic PDF text extraction)
          const textParts: string[] = [];
          const streamRegex = /stream\s*\n([\s\S]*?)endstream/g;
          let match;
          while ((match = streamRegex.exec(str)) !== null) {
            // Try to find readable text
            const content = match[1];
            const readable = content.replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s+/g, " ").trim();
            if (readable.length > 10) {
              textParts.push(readable);
            }
          }

          // Also try Tj/TJ text operators
          const tjRegex = /\(([^)]+)\)\s*Tj/g;
          while ((match = tjRegex.exec(str)) !== null) {
            textParts.push(match[1]);
          }

          // Try BT...ET blocks
          const btRegex = /BT\s*([\s\S]*?)ET/g;
          while ((match = btRegex.exec(str)) !== null) {
            const blockText = match[1].replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
            if (blockText.length > 5) {
              textParts.push(blockText);
            }
          }

          const finalText = textParts.join("\n").trim();
          resolve(finalText || "PDF se text extract nahi ho paya. Complex PDF hai — text-based PDF try karo.");
        };
        reader.readAsArrayBuffer(file);
      });

      setPdfText(text);
      setPdfName(file.name);
      setMessages([]);
      
      if (text.includes("extract nahi ho paya")) {
        toast.warning("PDF complex hai, limited text mila");
      } else {
        toast.success(`PDF loaded! ${text.split(" ").length} words extract hue`);
        // Auto summarize
        await askAI(text, "Is PDF ka short summary do Hindi-English mix mein.", []);
      }
    } catch {
      toast.error("PDF load nahi ho paya");
    }
    setExtracting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Sirf PDF files allowed hain!");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File 20MB se chhoti honi chahiye!");
      return;
    }
    extractText(file);
  };

  const askAI = async (context: string, userQuestion: string, prevMessages: Message[]) => {
    setLoading(true);
    const newMessages: Message[] = [...prevMessages, { role: "user", content: userQuestion }];
    setMessages(newMessages);

    try {
      const systemPrompt = `You are a helpful PDF assistant. Answer questions based on this PDF content. Be concise and helpful. Mix Hindi-English naturally.

PDF Content:
${context.slice(0, 4000)}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer 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",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Answer nahi mil paya";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Error aa gaya, dobara try karo" }]);
      toast.error("AI se response nahi aaya");
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleAsk = () => {
    if (!question.trim() || !pdfText) return;
    const q = question;
    setQuestion("");
    askAI(pdfText, q, messages);
  };

  const reset = () => {
    setPdfText("");
    setPdfName("");
    setMessages([]);
    setQuestion("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="gradient-text font-display text-base tracking-wide">PDF Chat</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">PDF upload karo — summary lo aur sawaal poochho</p>
            </div>
            {pdfName && (
              <Button onClick={reset} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* Upload */}
          {!pdfText && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-primary/5 group"
            >
              {extracting ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">PDF extract ho raha hai...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click to upload PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 20MB — Text-based PDFs best work</p>
                </>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* PDF loaded */}
          {pdfText && (
            <>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground font-medium truncate">{pdfName}</span>
                <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{pdfText.split(" ").length} words</span>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="h-[350px]" ref={scrollRef}>
                <div className="space-y-3 pr-2">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-secondary/20 text-foreground border border-secondary/20"
                            : "bg-muted/30 text-foreground border border-border"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-secondary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                      </div>
                      <div className="bg-muted/30 rounded-xl px-3.5 py-2.5 border border-border">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  placeholder="PDF ke baare mein kuch bhi poochho..."
                  className="bg-muted/10 h-10"
                  disabled={loading}
                />
                <Button
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                  className="h-10 px-4 bg-primary/20 text-primary hover:bg-primary/30"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFChat;
