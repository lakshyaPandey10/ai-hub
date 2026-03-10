import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Sparkles, Download, Loader2, Wand2, X, Languages } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const SUGGESTIONS = [
  "एक खूबसूरत सूर्यास्त पहाड़ों पर",
  "A futuristic city at sunset with flying cars",
  "बारिश में एक समुराई का portrait",
  "A cute cat wearing a space suit on the moon",
  "ताज महल at night with stars",
  "An underwater kingdom with glowing jellyfish",
];

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [translatedPrompt, setTranslatedPrompt] = useState("");
  const [history, setHistory] = useState<{ prompt: string; url: string }[]>([]);
  const retryRef = useRef<number>(0);
  const abortRef = useRef(false);

  const translatePrompt = async (text: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("translate-prompt", {
        body: { prompt: text },
      });
      if (error) throw error;
      return data?.translatedPrompt || text;
    } catch {
      return text; // Fallback to original
    }
  };

  const createImageUrl = (finalPrompt: string, seed: number) => {
    const encoded = encodeURIComponent(finalPrompt);
    return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&nologo=true&seed=${seed}`;
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Pehle prompt likho!");
      return;
    }

    setLoading(true);
    setImageUrl("");
    abortRef.current = false;
    retryRef.current = 0;

    // Translate if Hindi detected
    toast.info("Translating prompt...");
    const finalPrompt = await translatePrompt(prompt.trim());
    setTranslatedPrompt(finalPrompt);
    toast.success("Prompt ready!");

    tryLoadImage(finalPrompt);
  };

  const tryLoadImage = (finalPrompt: string) => {
    if (abortRef.current) {
      setLoading(false);
      toast.info("Generation cancelled");
      return;
    }

    retryRef.current += 1;
    const seed = Date.now() + retryRef.current * 1000;
    const url = createImageUrl(finalPrompt, seed);
    setImageUrl(url);

    if (retryRef.current > 1) {
      toast.info(`Retry ${retryRef.current}... thoda wait karo`);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setHistory((prev) => [{ prompt, url: imageUrl }, ...prev.slice(0, 9)]);
    toast.success("🎉 Image ready!");
  };

  const handleImageError = () => {
    if (abortRef.current) {
      setLoading(false);
      return;
    }
    // Auto retry
    setTimeout(() => {
      if (translatedPrompt && !abortRef.current) {
        tryLoadImage(translatedPrompt);
      }
    }, 2000);
  };

  const cancelGeneration = () => {
    abortRef.current = true;
    setLoading(false);
    setImageUrl("");
    toast.info("Generation cancelled");
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ai-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Image download ho gaya!");
    } catch {
      toast.error("Download fail");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="glass-card neon-border-purple">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <span className="gradient-text-pink font-display text-base tracking-wide">AI Image Generator</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Hindi/English → Image • Auto-retry until success</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)}
                className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-border bg-muted/20 text-muted-foreground hover:border-secondary/40 hover:text-secondary hover:bg-secondary/5 transition-all">
                {s.length > 30 ? `${s.slice(0, 30)}…` : s}
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="relative">
            <Wand2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); generateImage(); } }}
              placeholder="Jo bhi image chahiye likho (Hindi/English) — AI bana dega!"
              className="bg-muted/10 border-border focus-visible:ring-secondary/30 pl-9 min-h-[80px] max-h-[120px] resize-none text-sm"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Translated prompt indicator */}
          {translatedPrompt && translatedPrompt !== prompt && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border text-xs">
              <Languages className="w-4 h-4 text-secondary" />
              <span className="text-muted-foreground">Translated:</span>
              <span className="text-foreground flex-1 truncate">{translatedPrompt}</span>
            </div>
          )}

          {/* Generate / Cancel Button */}
          {!loading ? (
            <Button onClick={generateImage} disabled={!prompt.trim()}
              className="w-full bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 h-11 text-base">
              <Sparkles className="w-5 h-5 mr-2" /> Generate Image
            </Button>
          ) : (
            <Button onClick={cancelGeneration} variant="destructive" className="w-full h-11 text-base">
              <X className="w-5 h-5 mr-2" /> Cancel (Retry #{retryRef.current})
            </Button>
          )}

          {/* Image Display */}
          <div className="relative min-h-[350px] rounded-2xl border border-border bg-muted/5 flex items-center justify-center overflow-hidden">
            {!imageUrl && !loading && (
              <div className="text-center text-muted-foreground animate-fade-in p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/10">
                  <ImageIcon className="w-10 h-10 text-secondary/20" />
                </div>
                <p className="text-sm font-medium">Jo bhi likho — AI bana dega</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Hindi ya English, kuch bhi chale</p>
              </div>
            )}

            {loading && (
              <div className="text-center animate-fade-in">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-secondary/20 border-t-secondary animate-spin mx-auto" />
                  <Sparkles className="w-6 h-6 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">Creating your image...</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  {retryRef.current > 1 ? `Auto-retrying... attempt ${retryRef.current}` : "Please wait"}
                </p>
              </div>
            )}

            {imageUrl && (
              <img src={imageUrl} alt={prompt} className="w-full h-auto rounded-xl animate-fade-in"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </div>

          {/* Download button */}
          {imageUrl && !loading && (
            <Button onClick={handleDownload} variant="outline" className="w-full h-10 border-secondary/20 hover:bg-secondary/10 hover:text-secondary">
              <Download className="w-4 h-4 mr-2" /> Download Image
            </Button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recent ({history.length})</p>
                <button onClick={() => setHistory([])} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Clear</button>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {history.map((item, i) => (
                  <button key={i} onClick={() => { setPrompt(item.prompt); setImageUrl(item.url); }}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:border-secondary/40 transition-all hover:scale-105" title={item.prompt}>
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGenerator;
