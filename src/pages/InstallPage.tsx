import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, Share, MoreVertical } from "lucide-react";

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="text-center border-b border-border">
          <CardTitle className="flex items-center justify-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <span className="gradient-text font-display">Install AI Hub</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold text-foreground">Already Installed! ✅</h3>
              <p className="text-sm text-muted-foreground">AI Hub is already installed on your device. Check your home screen!</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <Smartphone className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Install like an App!</h3>
                <p className="text-sm text-muted-foreground">
                  No app store needed. Install directly from your browser — works like a real app!
                </p>
              </div>

              {/* Android / Chrome */}
              {deferredPrompt && (
                <Button onClick={handleInstall} className="w-full h-12 text-base">
                  <Download className="w-5 h-5 mr-2" /> Install AI Hub
                </Button>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <div className="p-4 rounded-xl bg-muted/20 space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">iPhone / iPad पर Install करें:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span> Safari में <Share className="w-4 h-4 inline text-primary" /> Share button दबाएं</p>
                    <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span> "Add to Home Screen" select करें</p>
                    <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span> "Add" दबाएं — Done! 🎉</p>
                  </div>
                </div>
              )}

              {/* Android manual instructions */}
              {!deferredPrompt && !isIOS && (
                <div className="p-4 rounded-xl bg-muted/20 space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">Android पर Install करें:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span> Chrome में <MoreVertical className="w-4 h-4 inline text-primary" /> 3-dot menu दबाएं</p>
                    <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span> "Install app" या "Add to Home screen" दबाएं</p>
                    <p className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span> "Install" दबाएं — Done! 🎉</p>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-muted-foreground">
                <strong className="text-accent">💡 Benefits:</strong> Home screen icon, full screen, fast loading, offline support, login याद रहता है!
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPage;
