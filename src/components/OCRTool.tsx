import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScanText, Upload, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const OCR_KEY = "K84718286888957";

const OCRTool = () => {
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("सिर्फ image files upload करो");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setExtractedText("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("apikey", OCR_KEY);
      formData.append("language", "hin,eng");
      formData.append("isOverlayRequired", "false");
      formData.append("OCREngine", "2");

      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ParsedResults && data.ParsedResults.length > 0) {
        const text = data.ParsedResults.map((r: any) => r.ParsedText).join("\n");
        setExtractedText(text);
        toast.success("Text extract हो गया! ✨");
      } else {
        toast.error("Text नहीं मिला, clear image try करो");
      }
    } catch {
      toast.error("OCR failed, try again");
    }
    setLoading(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success("Copied! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="glass-card neon-border h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanText className="w-5 h-5 text-accent" /> OCR - Image to Text
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Image upload करो (Hindi/English)</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>

        {preview && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={preview} alt="Preview" className="w-full max-h-48 object-contain bg-muted/20" />
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Text extract हो रहा है...</p>
          </div>
        )}

        {extractedText && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Extracted Text:</span>
              <Button onClick={copyText} size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Textarea
              value={extractedText}
              readOnly
              className="bg-muted/30 min-h-[120px] text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OCRTool;
