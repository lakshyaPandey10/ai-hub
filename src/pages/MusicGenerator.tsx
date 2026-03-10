import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music, Play, Pause, Download, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PRESETS = [
  { label: "🎹 Calm Piano", prompt: "calm peaceful piano melody with soft chords" },
  { label: "🎸 Lo-fi Chill", prompt: "lo-fi chill beats with warm bass and soft drums" },
  { label: "🎺 Energetic EDM", prompt: "energetic EDM with driving beat and synth leads" },
  { label: "😢 Sad Melody", prompt: "emotional sad melody with slow tempo and minor key" },
  { label: "🎻 Classical", prompt: "classical orchestral piece with violin and cello" },
  { label: "🌃 Cyberpunk", prompt: "dark cyberpunk synth with glitchy beats" },
  { label: "🎵 Bollywood", prompt: "Bollywood style melodious Indian music with tabla" },
  { label: "🎸 Rock", prompt: "powerful rock guitar riff with heavy drums" },
];

interface Composition {
  title: string;
  bpm: number;
  duration: number;
  tracks: {
    name: string;
    wave: OscillatorType;
    volume: number;
    notes: { freq: number; start: number; dur: number }[];
  }[];
}

const renderComposition = (ctx: AudioContext, comp: Composition): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.ceil(sampleRate * comp.duration);
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (const track of comp.tracks) {
    for (const note of track.notes) {
      const startSample = Math.floor(note.start * sampleRate);
      const durSamples = Math.floor(note.dur * sampleRate);
      const fadeLen = Math.min(Math.floor(0.02 * sampleRate), durSamples / 4);

      for (let i = 0; i < durSamples && startSample + i < totalSamples; i++) {
        const t = (startSample + i) / sampleRate;
        const phase = 2 * Math.PI * note.freq * t;
        let sample = 0;

        if (track.wave === "sine") {
          sample = Math.sin(phase) + 0.2 * Math.sin(2 * phase);
        } else if (track.wave === "triangle") {
          sample = 2 * Math.abs(2 * ((t * note.freq) % 1) - 1) - 1;
        } else if (track.wave === "sawtooth") {
          sample = 2 * ((t * note.freq) % 1) - 1;
        } else {
          sample = Math.sin(phase) > 0 ? 0.5 : -0.5;
        }

        // Envelope
        let env = 1;
        if (i < fadeLen) env = i / fadeLen;
        else if (i > durSamples - fadeLen) env = (durSamples - i) / fadeLen;

        const val = sample * track.volume * env;
        const idx = startSample + i;
        left[idx] += val;
        right[idx] += val * 0.95;
      }
    }
  }

  // Normalize
  let maxVal = 0;
  for (let i = 0; i < totalSamples; i++) {
    maxVal = Math.max(maxVal, Math.abs(left[i]), Math.abs(right[i]));
  }
  if (maxVal > 0.9) {
    const scale = 0.85 / maxVal;
    for (let i = 0; i < totalSamples; i++) {
      left[i] *= scale;
      right[i] *= scale;
    }
  }

  return buffer;
};

const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const bps = 16;
  const blockAlign = numCh * (bps / 8);
  const dataSize = buffer.length * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + dataSize, true); ws(8, "WAVE"); ws(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * blockAlign, true);
  v.setUint16(32, blockAlign, true); v.setUint16(34, bps, true); ws(36, "data"); v.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      v.setInt16(off, s * 0x7FFF, true); off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
};

// Fallback local composition
const localCompose = (text: string): Composition => {
  const lower = text.toLowerCase();
  let bpm = 100, wave: OscillatorType = "sine", baseNotes = [261.63, 329.63, 392, 523.25, 392, 329.63];

  if (lower.match(/sad|emotional|melancholy/)) { bpm = 65; baseNotes = [261.63, 293.66, 311.13, 261.63, 233.08, 207.65]; }
  else if (lower.match(/edm|energy|dance|party/)) { bpm = 138; wave = "sawtooth"; baseNotes = [329.63, 392, 440, 523.25, 587.33, 659.25]; }
  else if (lower.match(/lofi|lo-fi|chill|study/)) { bpm = 72; wave = "triangle"; baseNotes = [220, 261.63, 329.63, 293.66, 261.63, 220]; }
  else if (lower.match(/rock|metal|guitar/)) { bpm = 130; wave = "sawtooth"; baseNotes = [164.81, 196, 220, 261.63, 220, 196]; }
  else if (lower.match(/cyber|dark|synth/)) { bpm = 118; wave = "square"; baseNotes = [440, 466.16, 523.25, 554.37, 440, 349.23]; }
  else if (lower.match(/classical|orchestra|violin/)) { bpm = 88; baseNotes = [329.63, 392, 440, 523.25, 587.33, 523.25, 440, 392]; }
  else if (lower.match(/bollywood|indian|tabla|sitar/)) { bpm = 95; baseNotes = [261.63, 293.66, 329.63, 349.23, 392, 440]; }

  const noteDur = 60 / bpm;
  const melodyNotes = [];
  for (let i = 0; i < 30; i++) {
    melodyNotes.push({ freq: baseNotes[i % baseNotes.length], start: i * noteDur, dur: noteDur * 0.9 });
  }
  const bassNotes = [];
  for (let i = 0; i < 15; i++) {
    bassNotes.push({ freq: baseNotes[i % baseNotes.length] / 2, start: i * noteDur * 2, dur: noteDur * 1.8 });
  }

  return {
    title: text || "Generated Music",
    bpm,
    duration: 30 * noteDur,
    tracks: [
      { name: "melody", wave, volume: 0.35, notes: melodyNotes },
      { name: "bass", wave: "sine", volume: 0.25, notes: bassNotes },
    ],
  };
};

const MusicGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [compositionTitle, setCompositionTitle] = useState("");
  const [history, setHistory] = useState<{ prompt: string; url: string }[]>([]);
  const [useAI, setUseAI] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateMusic = async () => {
    const text = prompt.trim() || (selectedPreset !== null ? PRESETS[selectedPreset].prompt : "");
    if (!text) { toast.error("Preset select karo ya prompt likho!"); return; }

    setLoading(true);
    setAudioUrl("");
    setPlaying(false);
    if (audioRef.current) audioRef.current.pause();

    try {
      let composition: Composition;

      if (useAI) {
        toast.info("🤖 AI composing music...");
        try {
          const { data, error } = await supabase.functions.invoke("ai-compose-music", { body: { prompt: text } });
          if (error || !data?.composition) throw new Error("AI composition failed");
          composition = data.composition;
        } catch {
          toast.info("AI unavailable, using local engine...");
          composition = localCompose(text);
        }
      } else {
        composition = localCompose(text);
      }

      const ctx = new AudioContext();
      const buffer = renderComposition(ctx, composition);
      const wavBlob = bufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);

      setAudioUrl(url);
      setCompositionTitle(composition.title || text);
      const label = prompt.trim() || PRESETS[selectedPreset ?? 0]?.label || text;
      setHistory((prev) => [{ prompt: label, url }, ...prev.slice(0, 9)]);
      ctx.close();
      toast.success("🎵 Music generated!");
    } catch (err) {
      console.error(err);
      toast.error("Music generate nahi ho paya");
    }
    setLoading(false);
  };

  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => toast.error("Play nahi ho paya"));
      setPlaying(true);
      audioRef.current.onended = () => setPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `music-${Date.now()}.wav`;
    a.click();
    toast.success("Music download ho gaya! 🎶");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <audio ref={audioRef} />
      <Card className="glass-card neon-border-purple">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Music className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <span className="gradient-text-pink font-display text-base tracking-wide">AI Music Generator</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">AI-powered music composition — any style, any mood!</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* AI Toggle */}
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setUseAI(!useAI)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${useAI ? "border-secondary bg-secondary/15 text-secondary" : "border-border bg-muted/10 text-muted-foreground"}`}>
              {useAI ? "🤖 AI Compose ON" : "⚡ Local Engine"}
            </button>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((p, i) => (
              <button key={i}
                onClick={() => { setSelectedPreset(i === selectedPreset ? null : i); setPrompt(""); }}
                className={`text-xs px-3 py-2 rounded-xl border transition-all text-left ${
                  selectedPreset === i ? "border-secondary bg-secondary/15 text-secondary" : "border-border bg-muted/10 text-muted-foreground hover:border-secondary/30 hover:text-foreground"
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground">— ya kuch bhi likho —</div>

          <Input value={prompt} onChange={(e) => { setPrompt(e.target.value); setSelectedPreset(null); }}
            onKeyDown={(e) => e.key === "Enter" && !loading && generateMusic()}
            placeholder="Describe your music: happy bollywood, dark trap beat, romantic guitar..."
            className="bg-muted/10 h-11" disabled={loading} />

          <Button onClick={generateMusic} disabled={loading}
            className="w-full h-11 bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 text-base">
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Composing...</> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Music</>}
          </Button>

          {audioUrl && !loading && (
            <div className="p-5 rounded-2xl bg-muted/10 border border-border space-y-4">
              <div className="flex items-center justify-center gap-1 h-16">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i}
                    className={`w-1 rounded-full bg-secondary/50 transition-all duration-300 ${playing ? "animate-pulse" : ""}`}
                    style={{ height: playing ? `${Math.random() * 50 + 10}px` : "6px", animationDelay: `${i * 0.04}s` }} />
                ))}
              </div>
              <p className="text-sm text-center text-foreground font-medium truncate">🎵 {compositionTitle}</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={togglePlay} size="icon"
                  className="w-12 h-12 rounded-full bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button onClick={handleDownload} variant="outline" size="icon"
                  className="w-10 h-10 rounded-full border-border hover:border-secondary/30">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recent ({history.length})</p>
              <div className="space-y-1.5">
                {history.map((item, i) => (
                  <button key={i} onClick={() => { setAudioUrl(item.url); setCompositionTitle(item.prompt); }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-muted/10 border border-border hover:border-secondary/30 transition-all flex items-center gap-2 group">
                    <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-secondary shrink-0" />
                    <span className="text-sm text-foreground truncate">{item.prompt}</span>
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

export default MusicGenerator;
