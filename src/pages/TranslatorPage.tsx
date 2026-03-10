import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, ArrowRightLeft, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GROQ_KEY = "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";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "it", name: "Italian" },
];

const TranslatorPage = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("hi");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const translate = async () => {
    if (!inputText.trim()) {
      toast.error("Enter text to translate");
      return;
    }
    setLoading(true);
    try {
      const fromName = languages.find((l) => l.code === fromLang)?.name;
      const toName = languages.find((l) => l.code === toLang)?.name;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text from ${fromName} to ${toName}. Only provide the translation, no explanations.`,
            },
            { role: "user", content: inputText },
          ],
          max_tokens: 1024,
        }),
      });

      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();
      setOutputText(data.choices?.[0]?.message?.content || "Translation failed");
    } catch {
      toast.error("Translation failed, try again");
    }
    setLoading(false);
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <span className="gradient-text font-display text-base tracking-wide">Translator</span>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted/30 border border-border">
              AI Powered
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Language selectors */}
          <div className="flex items-center gap-3">
            <Select value={fromLang} onValueChange={setFromLang}>
              <SelectTrigger className="bg-muted/30 h-10 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={swapLanguages}
              size="icon"
              variant="ghost"
              className="shrink-0 text-primary hover:bg-primary/10 rounded-full"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>

            <Select value={toLang} onValueChange={setToLang}>
              <SelectTrigger className="bg-muted/30 h-10 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {languages.find((l) => l.code === fromLang)?.name}
              </p>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to translate..."
                className="bg-muted/20 min-h-[180px] resize-none border-border"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {languages.find((l) => l.code === toLang)?.name}
                </p>
                {outputText && (
                  <Button onClick={copyOutput} size="sm" variant="ghost" className="h-6 px-2 text-muted-foreground hover:text-primary">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                )}
              </div>
              <div className="bg-muted/10 border border-border rounded-lg min-h-[180px] p-3 text-sm text-foreground">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Translating...
                  </div>
                ) : outputText || (
                  <span className="text-muted-foreground/50">Translation will appear here</span>
                )}
              </div>
            </div>
          </div>

          <Button onClick={translate} disabled={loading || !inputText.trim()} className="w-full h-11">
            <Languages className="w-4 h-4 mr-2" />
            {loading ? "Translating..." : "Translate"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslatorPage;
