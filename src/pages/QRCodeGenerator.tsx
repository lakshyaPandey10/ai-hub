import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Download, Link, Wifi, FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SIZES = [
  { value: "200", label: "200×200 (Small)" },
  { value: "400", label: "400×400 (Medium)" },
  { value: "600", label: "600×600 (Large)" },
  { value: "1000", label: "1000×1000 (XL)" },
];

const COLORS = [
  { value: "000000", label: "⬛ Black" },
  { value: "1a1a2e", label: "🌑 Dark Navy" },
  { value: "e94560", label: "🔴 Red" },
  { value: "0f3460", label: "🔵 Blue" },
  { value: "16213e", label: "🟣 Dark Blue" },
  { value: "533483", label: "💜 Purple" },
  { value: "2d6a4f", label: "🟢 Green" },
];

const QRCodeGenerator = () => {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState("WPA");
  const [size, setSize] = useState("400");
  const [color, setColor] = useState("000000");
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const generateQR = (data: string) => {
    if (!data.trim()) { toast.error("Data enter karo!"); return; }
    const encoded = encodeURIComponent(data);
    const qr = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=${size}x${size}&color=${color}&bgcolor=ffffff&format=png`;
    setQrUrl(qr);
    toast.success("QR Code generated!");
  };

  const handleGenerate = () => {
    if (tab === "text") generateQR(text);
    else if (tab === "url") generateQR(url);
    else if (tab === "wifi") {
      const wifiData = `WIFI:T:${wifiEncryption};S:${wifiName};P:${wifiPassword};;`;
      generateQR(wifiData);
    }
  };

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `qr-code-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("QR Code downloaded!");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleCopy = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("QR URL copied!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="glass-card neon-border-purple">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <QrCode className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <span className="gradient-text-pink font-display text-base tracking-wide">QR Code Generator</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Text, URLs, WiFi passwords → instant QR codes</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Size</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-9 bg-background/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Color</label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="h-9 bg-background/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{COLORS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="text" className="text-xs gap-1"><FileText className="w-3 h-3" /> Text</TabsTrigger>
              <TabsTrigger value="url" className="text-xs gap-1"><Link className="w-3 h-3" /> URL</TabsTrigger>
              <TabsTrigger value="wifi" className="text-xs gap-1"><Wifi className="w-3 h-3" /> WiFi</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-3">
              <Textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Enter any text to encode as QR code"
                className="bg-muted/10 border-border min-h-[80px] text-sm" />
            </TabsContent>

            <TabsContent value="url" className="mt-3">
              <Input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-muted/10 border-border text-sm h-10" />
            </TabsContent>

            <TabsContent value="wifi" className="mt-3 space-y-3">
              <Input value={wifiName} onChange={(e) => setWifiName(e.target.value)}
                placeholder="WiFi Network Name (SSID)"
                className="bg-muted/10 border-border text-sm h-10" />
              <Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="WiFi Password" type="password"
                className="bg-muted/10 border-border text-sm h-10" />
              <Select value={wifiEncryption} onValueChange={setWifiEncryption}>
                <SelectTrigger className="h-9 bg-background/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">No Password</SelectItem>
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>

          <Button onClick={handleGenerate} className="w-full bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 h-10">
            <QrCode className="w-4 h-4 mr-2" /> Generate QR Code
          </Button>

          {qrUrl && (
            <div className="space-y-3">
              <div className="flex justify-center p-6 rounded-2xl border border-border bg-white">
                <img src={qrUrl} alt="QR Code" className="max-w-[300px] w-full" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" className="flex-1 h-9 text-sm border-secondary/20 hover:bg-secondary/10 hover:text-secondary">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
                <Button onClick={handleCopy} variant="outline" className="h-9 text-sm px-3">
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
