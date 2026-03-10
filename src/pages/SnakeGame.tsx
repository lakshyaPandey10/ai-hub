import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Play, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

const GRID = 20;
const CELL = 16;
const SPEED = 120;

type Pos = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const SnakeGame = () => {
  const [snake, setSnake] = useState<Pos[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Pos>({ x: 5, y: 5 });
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("snake_hi") || 0));
  const dirRef = useRef<Dir>("RIGHT");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const randomFood = useCallback((s: Pos[]): Pos => {
    let p: Pos;
    do { p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
    while (s.some(seg => seg.x === p.x && seg.y === p.y));
    return p;
  }, []);

  const reset = () => {
    const s = [{ x: 10, y: 10 }];
    setSnake(s);
    setFood(randomFood(s));
    setDir("RIGHT");
    dirRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setRunning(false);
  };

  const changeDir = useCallback((d: Dir) => {
    const opp: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (d !== opp[dirRef.current]) { dirRef.current = d; setDir(d); }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT" };
      if (map[e.key]) { e.preventDefault(); changeDir(map[e.key]); if (!running && !gameOver) setRunning(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [changeDir, running, gameOver]);

  useEffect(() => {
    if (!running || gameOver) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        const d = dirRef.current;
        if (d === "UP") head.y--; else if (d === "DOWN") head.y++;
        else if (d === "LEFT") head.x--; else head.x++;

        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || prev.some(s => s.x === head.x && s.y === head.y)) {
          setGameOver(true); setRunning(false);
          setHighScore(h => { const n = Math.max(h, score); localStorage.setItem("snake_hi", String(n)); return n; });
          return prev;
        }

        const next = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood(randomFood(next));
        } else { next.pop(); }
        return next;
      });
    }, SPEED);
    return () => clearInterval(interval);
  }, [running, gameOver, food, score, randomFood]);

  // Draw
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "hsl(var(--muted) / 0.3)";
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
    // Food
    ctx.fillStyle = "hsl(var(--destructive))";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)";
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 3);
      ctx.fill();
    });
  }, [snake, food]);

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="text-center border-b border-border">
          <CardTitle className="flex items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <span className="gradient-text font-display">Snake Game</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between text-sm px-1">
            <span>Score: <strong className="text-primary">{score}</strong></span>
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-accent" /> Best: {highScore}</span>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={GRID * CELL}
              height={GRID * CELL}
              className="rounded-xl border border-border bg-muted/10"
            />
          </div>

          {gameOver && (
            <div className="text-center text-destructive font-bold animate-fade-in">Game Over! Score: {score}</div>
          )}

          {/* Mobile controls */}
          <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto sm:hidden">
            <div />
            <Button size="sm" variant="outline" onClick={() => { changeDir("UP"); if (!running && !gameOver) setRunning(true); }}><ArrowUp className="w-4 h-4" /></Button>
            <div />
            <Button size="sm" variant="outline" onClick={() => { changeDir("LEFT"); if (!running && !gameOver) setRunning(true); }}><ArrowLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => { changeDir("DOWN"); if (!running && !gameOver) setRunning(true); }}><ArrowDown className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => { changeDir("RIGHT"); if (!running && !gameOver) setRunning(true); }}><ArrowRight className="w-4 h-4" /></Button>
          </div>

          <div className="flex gap-2">
            {!running && !gameOver && (
              <Button onClick={() => setRunning(true)} className="flex-1"><Play className="w-4 h-4 mr-2" /> Start</Button>
            )}
            <Button onClick={reset} variant="outline" className="flex-1"><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Arrow keys / WASD to move</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnakeGame;
