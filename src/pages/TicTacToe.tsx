import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, RotateCcw, Trophy } from "lucide-react";

type Player = "X" | "O" | null;

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const TicTacToe = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  const getWinner = useCallback((b: Player[]): { winner: Player; line: number[] } | null => {
    for (const l of WINNING_LINES) {
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) {
        return { winner: b[l[0]], line: l };
      }
    }
    return null;
  }, []);

  const result = getWinner(board);
  const isDraw = !result && board.every(Boolean);

  const handleClick = (i: number) => {
    if (board[i] || result) return;
    const next = [...board];
    next[i] = isX ? "X" : "O";
    setBoard(next);
    const w = getWinner(next);
    if (w) {
      setScores(s => ({ ...s, [w.winner === "X" ? "x" : "o"]: s[w.winner === "X" ? "x" : "o"] + 1 }));
    } else if (next.every(Boolean)) {
      setScores(s => ({ ...s, draw: s.draw + 1 }));
    }
    setIsX(!isX);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="text-center border-b border-border">
          <CardTitle className="flex items-center justify-center gap-2">
            <Grid3X3 className="w-5 h-5 text-primary" />
            <span className="gradient-text font-display">Tic Tac Toe</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-2 rounded-lg bg-primary/10"><span className="font-bold text-primary">X</span><br/>{scores.x}</div>
            <div className="p-2 rounded-lg bg-muted/30"><span className="font-bold text-muted-foreground">Draw</span><br/>{scores.draw}</div>
            <div className="p-2 rounded-lg bg-secondary/10"><span className="font-bold text-secondary">O</span><br/>{scores.o}</div>
          </div>

          {/* Status */}
          <div className="text-center text-sm font-medium">
            {result ? (
              <span className="flex items-center justify-center gap-1 text-accent"><Trophy className="w-4 h-4" /> Player {result.winner} wins!</span>
            ) : isDraw ? (
              <span className="text-muted-foreground">It's a draw!</span>
            ) : (
              <span>Player <span className={isX ? "text-primary font-bold" : "text-secondary font-bold"}>{isX ? "X" : "O"}</span>'s turn</span>
            )}
          </div>

          {/* Board */}
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`aspect-square rounded-xl text-2xl font-bold transition-all duration-200 border
                  ${cell ? "cursor-default" : "cursor-pointer hover:bg-muted/40"}
                  ${result?.line.includes(i) ? "bg-accent/20 border-accent/40 scale-105" : "border-border bg-muted/10"}
                  ${cell === "X" ? "text-primary" : "text-secondary"}
                `}
              >
                {cell}
              </button>
            ))}
          </div>

          <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" /> New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicTacToe;
