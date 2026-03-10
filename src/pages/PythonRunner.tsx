import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Loader2, Sparkles, Terminal, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EXAMPLES = [
  { label: "🔢 Fibonacci", code: `def fibonacci(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint(fibonacci(15))` },
  { label: "📊 Sorting", code: `nums = [64, 34, 25, 12, 22, 11, 90]\nnums.sort()\nprint("Sorted:", nums)\n\n# Reverse sort\nnums.sort(reverse=True)\nprint("Reverse:", nums)` },
  { label: "🎲 Random", code: `import random\n\nfor i in range(5):\n    dice = random.randint(1, 6)\n    print(f"Roll {i+1}: {dice} 🎲")` },
  { label: "📐 Math", code: `import math\n\nprint(f"Pi = {math.pi:.10f}")\nprint(f"e = {math.e:.10f}")\nprint(f"sqrt(144) = {math.sqrt(144)}")\nprint(f"factorial(10) = {math.factorial(10)}")` },
];

const PythonRunner = () => {
  const [code, setCode] = useState(`# Python Code Runner 🐍\nprint("Hello, World!")\n\nfor i in range(5):\n    print(f"Number: {i}")`);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const pyodideRef = useRef<any>(null);
  const loadingRef = useRef(false);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    if (loadingRef.current) return null;
    loadingRef.current = true;

    try {
      // Load Pyodide from CDN
      if (!(window as any).loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
        document.head.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Pyodide"));
        });
      }
      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });
      pyodideRef.current = pyodide;
      return pyodide;
    } catch (err) {
      console.error("Pyodide load error:", err);
      toast.error("Python engine load nahi hua");
      return null;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const runCode = async () => {
    if (!code.trim()) { toast.error("Code likho pehle!"); return; }
    setRunning(true);
    setOutput("⏳ Loading Python engine...\n");

    try {
      const pyodide = await loadPyodide();
      if (!pyodide) { setOutput("❌ Python engine load nahi hua. Retry karo."); setRunning(false); return; }

      setOutput("▶ Running...\n");

      // Capture stdout
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);

      try {
        pyodide.runPython(code);
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        const stderr = pyodide.runPython("sys.stderr.getvalue()");
        let result = "";
        if (stdout) result += stdout;
        if (stderr) result += "\n⚠️ Stderr:\n" + stderr;
        setOutput(result || "✅ Code ran successfully (no output)");
      } catch (pyErr: any) {
        setOutput("❌ Error:\n" + (pyErr.message || String(pyErr)));
      }

      // Reset stdout
      pyodide.runPython(`
import sys
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
    } catch (err: any) {
      setOutput("❌ " + (err.message || "Unknown error"));
    }
    setRunning(false);
  };

  const askAI = async (action: "write" | "fix" | "explain") => {
    const prompt = action === "write" ? aiPrompt.trim() : code.trim();
    if (!prompt) { toast.error(action === "write" ? "AI prompt likho!" : "Code likho pehle!"); return; }

    setAiLoading(true);
    try {
      const systemPrompts: Record<string, string> = {
        write: "You are a Python code generator. Write clean, well-commented Python code based on the user's request. Return ONLY the Python code, no markdown fences.",
        fix: "You are a Python code fixer. Analyze the given Python code, fix any bugs or errors, and return the corrected code. Return ONLY the fixed Python code, no markdown fences or explanations.",
        explain: "You are a Python code explainer. Explain the given Python code in simple terms. Use bullet points. Be concise. Respond in the same language as the user's code comments (Hindi if Hindi comments, English otherwise).",
      };

      const userMessages: Record<string, string> = {
        write: `Write Python code for: ${prompt}`,
        fix: `Fix this Python code:\n\n${prompt}`,
        explain: `Explain this Python code:\n\n${prompt}`,
      };

      const { data, error } = await supabase.functions.invoke("python-ai", {
        body: { 
          messages: [
            { role: "system", content: systemPrompts[action] },
            { role: "user", content: userMessages[action] }
          ],
          action 
        },
      });

      if (error) throw error;

      if (action === "explain") {
        setOutput("🤖 AI Explanation:\n\n" + (data?.result || "No response"));
      } else {
        const newCode = (data?.result || "").replace(/```python\n?/g, "").replace(/```\n?/g, "").trim();
        if (newCode) {
          setCode(newCode);
          toast.success(action === "write" ? "AI ne code likh diya! ✨" : "AI ne code fix kar diya! 🔧");
        }
      }
    } catch (err: any) {
      console.error("AI error:", err);
      toast.error("AI se response nahi aaya");
    }
    setAiLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      <Card className="glass-card neon-border-purple">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center border border-secondary/20">
              <Terminal className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <span className="gradient-text-pink font-display text-base tracking-wide">Python Runner</span>
              <p className="text-[10px] text-muted-foreground font-normal mt-0.5">Write, Run & Debug Python with AI — works in browser!</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* AI Prompt */}
          <div className="flex gap-2">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !aiLoading && askAI("write")}
              placeholder="AI se code likhwao: e.g. 'calculator banao', 'sort algorithm'..."
              className="bg-muted/10 h-10 flex-1"
              disabled={aiLoading}
            />
            <Button onClick={() => askAI("write")} disabled={aiLoading} className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/20 h-10">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" /> AI Write</>}
            </Button>
          </div>

          {/* Examples */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} onClick={() => { setCode(ex.code); toast.success(`${ex.label} loaded!`); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:border-secondary/30 hover:text-foreground transition-all">
                {ex.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Code Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Code Editor</span>
                <div className="flex gap-1.5">
                  <Button onClick={handleCopy} variant="ghost" size="icon" className="h-7 w-7">
                    {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  <Button onClick={() => setCode("")} variant="ghost" size="icon" className="h-7 w-7">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="# Write Python code here..."
                className="font-mono text-xs bg-muted/10 border-border min-h-[320px] resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Output</span>
              <div className="font-mono text-xs bg-muted/10 border border-border rounded-md p-4 min-h-[320px] whitespace-pre-wrap text-foreground overflow-auto">
                {output || "▶ Click Run to see output..."}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={runCode} disabled={running}
              className="bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20 h-10 flex-1 sm:flex-none">
              {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><Play className="w-4 h-4 mr-2" /> Run Code</>}
            </Button>
            <Button onClick={() => askAI("fix")} disabled={aiLoading} variant="outline" className="h-10 flex-1 sm:flex-none">
              🔧 AI Fix
            </Button>
            <Button onClick={() => askAI("explain")} disabled={aiLoading} variant="outline" className="h-10 flex-1 sm:flex-none">
              💡 AI Explain
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PythonRunner;
