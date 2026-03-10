import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RotateCcw, Trophy, Timer } from "lucide-react";

const EMOJIS = ["🎮", "🎵", "🎨", "🚀", "⚡", "🔥", "💎", "🌟"];

interface CardData {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryGame = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [active, setActive] = useState(false);
  const [best, setBest] = useState(() => Number(localStorage.getItem("memory_best") || 0));

  const init = () => {
    const pairs = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setActive(false);
  };

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(i);
  }, [active]);

  const handleFlip = (id: number) => {
    if (selected.length >= 2 || cards[id].flipped || cards[id].matched) return;
    if (!active) setActive(true);

    const next = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(next);
    const newSel = [...selected, id];
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newSel;
      if (next[a].emoji === next[b].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c));
          setMatches(m => {
            const newM = m + 1;
            if (newM === EMOJIS.length) {
              setActive(false);
              const totalMoves = moves + 1;
              if (!best || totalMoves < best) {
                setBest(totalMoves);
                localStorage.setItem("memory_best", String(totalMoves));
              }
            }
            return newM;
          });
          setSelected([]);
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  };

  const won = matches === EMOJIS.length;

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <Card className="glass-card neon-border">
        <CardHeader className="text-center border-b border-border">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="gradient-text font-display">Memory Game</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between text-sm px-1">
            <span>Moves: <strong className="text-primary">{moves}</strong></span>
            <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {timer}s</span>
            {best > 0 && <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-accent" /> {best}</span>}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleFlip(card.id)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border
                  ${card.flipped || card.matched
                    ? "bg-primary/10 border-primary/30 scale-100"
                    : "bg-muted/20 border-border hover:bg-muted/40 hover:scale-105 cursor-pointer"
                  }
                  ${card.matched ? "opacity-60" : ""}
                `}
              >
                {card.flipped || card.matched ? card.emoji : "?"}
              </button>
            ))}
          </div>

          {won && (
            <div className="text-center space-y-2 animate-fade-in">
              <p className="text-accent font-bold flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> You won in {moves} moves & {timer}s!
              </p>
            </div>
          )}

          <Button onClick={init} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" /> New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoryGame;
