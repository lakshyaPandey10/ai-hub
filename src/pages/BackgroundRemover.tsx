import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, Upload, Download, Loader2, ImageIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const BackgroundRemover = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Sirf image files allowed hain!");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File 10MB se chhoti honi chahiye!");
      return;
    }
    setFileName(file.name);
    setProcessedImage(null);
    const reader = new FileReader();
    reader.onload = (ev) => setOriginalImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeBackground = async () => {
    if (!originalImage) return;
    setLoading(true);
    try {
      // Using remove.bg free API
      const blob = await fetch(originalImage).then(r => r.blob());
      const formData = new FormData();
      formData.append("image_file", blob, fileName || "image.png");
      formData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": "WExb68bgP7LMjkYkxSM8jEVb" },
        body: formData,
      });

      if (!response.ok) {
        // Fallback: client-side canvas processing
        await clientSideRemove();
        return;
      }

      const resultBlob = await response.blob();
      const url = URL.createObjectURL(resultBlob);
      setProcessedImage(url);
      toast.success("Background remove ho gaya! ✨");
    } catch {
      // Fallback
      await clientSideRemove();
    }
    setLoading(false);
  };

  const clientSideRemove = async () => {
    if (!originalImage) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = originalImage;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple background removal: detect corners color as bg
      const bgR = data[0], bgG = data[1], bgB = data[2];
      const threshold = 45;

      for (let i = 0; i < data.length; i += 4) {
        const diffR = Math.abs(data[i] - bgR);
        const diffG = Math.abs(data[i + 1] - bgG);
        const diffB = Math.abs(data[i + 2] - bgB);
        if (diffR < threshold && diffG < threshold && diffB < threshold) {
          data[i + 3] = 0; // Make transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL("image/png"));
      toast.success("Background remove ho gaya (basic mode)! ✨");
    } catch {
      toast.error("Background remove nahi ho paya");
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement("a");
    a.href = processedImage;
    a.download = `no-bg-${fileName || "image"}.png`;
    a.click();
    toast.success("Download ho gaya!");
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <Card className="glass-card neon-border-pink">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/20">
              <Eraser className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <span className="gradient-text-pink font-display text-base tracking-wide">Background Remover</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Image upload karo — background instantly remove</p>
            </div>
            <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted/30 border border-border">
              ✨ Free
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* Upload Area */}
          {!originalImage && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-accent/40 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-accent/5 group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-accent/40 group-hover:text-accent transition-colors" />
              </div>
              <p className="text-sm font-medium text-foreground">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — Max 10MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview */}
          {originalImage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Original</p>
                  <div className="rounded-xl border border-border overflow-hidden bg-muted/10 flex items-center justify-center min-h-[250px]">
                    <img src={originalImage} alt="Original" className="max-w-full max-h-[300px] object-contain" />
                  </div>
                </div>

                {/* Processed */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {processedImage ? "Background Removed" : "Result"}
                  </p>
                  <div
                    className="rounded-xl border border-border overflow-hidden flex items-center justify-center min-h-[250px]"
                    style={{
                      backgroundImage: processedImage
                        ? "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 20px 20px"
                        : "none",
                      backgroundColor: processedImage ? "transparent" : "hsl(var(--muted) / 0.1)",
                    }}
                  >
                    {processedImage ? (
                      <img src={processedImage} alt="No Background" className="max-w-full max-h-[300px] object-contain" />
                    ) : (
                      <div className="text-center p-8">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Click "Remove Background" to process</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!processedImage && (
                  <Button
                    onClick={removeBackground}
                    disabled={loading}
                    className="flex-1 h-10 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><Eraser className="w-4 h-4 mr-2" /> Remove Background</>
                    )}
                  </Button>
                )}
                {processedImage && (
                  <Button
                    onClick={handleDownload}
                    className="flex-1 h-10 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PNG
                  </Button>
                )}
                <Button onClick={reset} variant="outline" className="h-10 px-4 border-border">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackgroundRemover;
