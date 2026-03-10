import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, ExternalLink, Trash2, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
}

const URLShortener = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<ShortenedLink[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("url-shortener-history") || "[]");
    } catch {
      return [];
    }
  });

  const saveHistory = (items: ShortenedLink[]) => {
    setHistory(items);
    localStorage.setItem("url-shortener-history", JSON.stringify(items));
  };

  const isValidUrl = (str: string) => {
    try {
      const u = new URL(str.startsWith("http") ? str : `https://${str}`);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const shortenUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("URL enter karo!");
      return;
    }

    const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;

    if (!isValidUrl(fullUrl)) {
      toast.error("Valid URL enter karo!");
      return;
    }

    setLoading(true);

    try {
      // Using TinyURL API (free, no key needed)
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
      if (!res.ok) throw new Error("Failed");
      const shortUrl = await res.text();

      if (!shortUrl.startsWith("http")) throw new Error("Invalid response");

      const newLink: ShortenedLink = {
        id: Date.now().toString(),
        originalUrl: fullUrl,
        shortUrl,
        createdAt: new Date().toLocaleString(),
      };

      saveHistory([newLink, ...history.slice(0, 49)]);
      setUrl("");
      toast.success("URL shortened! 🔗");
    } catch {
      toast.error("URL shorten nahi ho paya, dobara try karo");
    }

    setLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied!");
  };

  const handleDelete = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
    toast.success("Link removed");
  };

  const clearAll = () => {
    saveHistory([]);
    toast.success("All links cleared");
  };

  const getQrUrl = (url: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=200x200&format=png`;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="glass-card neon-border-purple">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Link2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <span className="gradient-text-pink font-display text-base tracking-wide">URL Shortener</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Shorten URLs • QR Codes • History</p>
            </div>
            {history.length > 0 && (
              <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted/30 border border-border">
                {history.length} links
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && shortenUrl()}
              placeholder="Paste your long URL here..."
              className="bg-muted/10 border-border h-11 text-sm"
              disabled={loading}
            />
            <Button
              onClick={shortenUrl}
              disabled={loading || !url.trim()}
              className="h-11 px-6 bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Shortened Links ({history.length})
                </p>
                <button
                  onClick={clearAll}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-muted/10 border border-border space-y-3 hover:border-secondary/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* QR Code */}
                      <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border bg-white">
                        <img
                          src={getQrUrl(item.shortUrl)}
                          alt="QR"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Short URL */}
                        <div className="flex items-center gap-2">
                          <a
                            href={item.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-secondary hover:underline truncate"
                          >
                            {item.shortUrl}
                          </a>
                          <button
                            onClick={() => handleCopy(item.shortUrl, item.id)}
                            className="shrink-0 text-muted-foreground hover:text-secondary transition-colors"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={item.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-secondary transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Original URL */}
                        <p className="text-[11px] text-muted-foreground truncate">{item.originalUrl}</p>

                        {/* Meta */}
                        <p className="text-[10px] text-muted-foreground/50">{item.createdAt}</p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {history.length === 0 && (
            <div className="min-h-[200px] rounded-2xl border border-border bg-muted/5 flex items-center justify-center">
              <div className="text-center text-muted-foreground p-8">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/10">
                  <Link2 className="w-8 h-8 text-secondary/20" />
                </div>
                <p className="text-sm font-medium">Paste any long URL above</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Get a short link + QR code instantly</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default URLShortener;
