import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_KEY = "pub_91624cb0e2324c9db31b993808d3d2a0";

interface NewsItem {
  article_id: string;
  title: string;
  description: string | null;
  link: string;
  source_name: string;
  pubDate: string;
  image_url: string | null;
}

const NewsWidget = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${API_KEY}&country=in&language=hi,en&size=10`);
      const data = await res.json();
      if (data.results) setNews(data.results);
    } catch {
      toast.error("Failed to load news");
    }
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  return (
    <Card className="glass-card neon-border h-full">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Newspaper className="w-4 h-4 text-secondary" />
            </div>
            <span className="gradient-text-pink font-display text-base tracking-wide">Latest News</span>
          </CardTitle>
          <Button onClick={fetchNews} disabled={loading} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ScrollArea className="h-[500px] pr-2 scrollbar-thin">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((item, index) => (
                <a
                  key={item.article_id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl bg-muted/10 hover:bg-muted/30 border border-transparent hover:border-primary/20 transition-all duration-300 group animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start gap-3">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-2 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-muted/30 font-medium">{item.source_name}</span>
                        <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsWidget;
