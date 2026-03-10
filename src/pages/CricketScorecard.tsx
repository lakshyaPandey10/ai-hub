import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, RefreshCw, Clock, MapPin, Radio, ChevronRight, ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";

interface Match {
  id: string;
  name: string;
  status: string;
  matchType: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: { name: string; shortname: string; img: string }[];
  score?: { r: number; w: number; o: number; inning: string }[];
  series_id?: string;
  fantasyEnabled?: boolean;
  bbbEnabled?: boolean;
  hasSquad?: boolean;
  matchStarted?: boolean;
  matchEnded?: boolean;
}

interface ScorecardInning {
  inning: string;
  battingCard?: {
    batsman: { name: string };
    "dismissal-text": string;
    r: number;
    b: number;
    "4s": number;
    "6s": number;
    sr: string;
  }[];
  bowlingCard?: {
    bowler: { name: string };
    o: number;
    m: number;
    r: number;
    w: number;
    eco: string;
  }[];
  extras?: { t: number; b: number; lb: number; w: number; nb: number; p: number };
  totalScore?: { r: number; w: number; o: number };
}

const API_KEY = 'c6e9e2d0-5a9e-4d6d-bf4f-93489b9b31ed';
const BASE = 'https://api.cricapi.com/v1';

const callCricketApi = async (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('apikey', API_KEY);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  const data = await res.json();
  return data;
};

// ─── Team Score Row (mobile-first) ───
const TeamScoreRow = ({ score }: { score: { r: number; w: number; o: number; inning: string } }) => {
  const teamName = score.inning.replace(/ Inning.*$/i, "").trim();
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground truncate max-w-[55%]">{teamName}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-bold text-foreground">{score.r}/{score.w}</span>
        <span className="text-[10px] text-muted-foreground">({score.o} ov)</span>
      </div>
    </div>
  );
};

// ─── Match Card (mobile-optimized) ───
const MatchCard = ({ match, onSelect }: { match: Match; onSelect: (id: string) => void }) => {
  const isLive = match.matchStarted && !match.matchEnded;
  const isCompleted = match.matchEnded;

  return (
    <Card
      className="cursor-pointer active:scale-[0.98] transition-all duration-150 border-border/60 hover:border-primary/30"
      onClick={() => onSelect(match.id)}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {isLive && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] px-1.5 py-0 h-4 gap-0.5">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                LIVE
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                COMPLETED
              </Badge>
            )}
            {!isLive && !isCompleted && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                UPCOMING
              </Badge>
            )}
          </div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{match.matchType}</span>
        </div>

        {/* Teams & Scores */}
        {match.teams && match.teams.length === 2 && (
          <div className="mb-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold truncate max-w-[45%]">{match.teams[0]}</span>
              <span className="text-[10px] text-muted-foreground">vs</span>
              <span className="text-sm font-semibold truncate max-w-[45%] text-right">{match.teams[1]}</span>
            </div>
          </div>
        )}

        {match.score && match.score.length > 0 && (
          <div className="bg-muted/40 rounded-lg px-2.5 py-1.5 mb-2 border border-border/40">
            {match.score.map((s, i) => (
              <TeamScoreRow key={i} score={s} />
            ))}
          </div>
        )}

        {/* Status */}
        <p className="text-[11px] text-primary/80 font-medium line-clamp-2 mb-2">{match.status}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{match.venue}</span>
          </div>
          <div className="flex items-center gap-0.5 text-primary/50 shrink-0 ml-2">
            <span className="text-[9px]">Details</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Batting Table (mobile scroll) ───
const BattingTable = ({ battingCard, extras, totalScore }: { 
  battingCard: ScorecardInning["battingCard"]; 
  extras?: ScorecardInning["extras"];
  totalScore?: ScorecardInning["totalScore"];
}) => {
  if (!battingCard || battingCard.length === 0) return null;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">🏏 Batting</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[420px]">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-1.5 pl-3 text-muted-foreground font-medium">Batter</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">R</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">B</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">4s</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">6s</th>
                  <th className="text-center p-1.5 pr-3 text-muted-foreground font-medium w-10">SR</th>
                </tr>
              </thead>
              <tbody>
                {battingCard.map((b, bi) => (
                  <tr key={bi} className="border-b border-border/30">
                    <td className="p-1.5 pl-3">
                      <div className="font-medium text-[11px]">{b.batsman?.name || "Unknown"}</div>
                      <div className="text-[9px] text-muted-foreground truncate max-w-[140px]">{b["dismissal-text"] || "not out"}</div>
                    </td>
                    <td className="text-center p-1.5 font-bold">{b.r}</td>
                    <td className="text-center p-1.5 text-muted-foreground">{b.b}</td>
                    <td className="text-center p-1.5">{b["4s"]}</td>
                    <td className="text-center p-1.5">{b["6s"]}</td>
                    <td className="text-center p-1.5 pr-3 text-muted-foreground">{b.sr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {extras && (
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border/40">
            Extras: {extras.t} (b {extras.b}, lb {extras.lb}, w {extras.w}, nb {extras.nb})
          </div>
        )}
        {totalScore && (
          <div className="px-3 py-2 text-xs font-bold border-t border-border bg-muted/20">
            Total: {totalScore.r}/{totalScore.w} ({totalScore.o} ov)
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Bowling Table (mobile scroll) ───
const BowlingTable = ({ bowlingCard }: { bowlingCard: ScorecardInning["bowlingCard"] }) => {
  if (!bowlingCard || bowlingCard.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">🎳 Bowling</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[340px]">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-1.5 pl-3 text-muted-foreground font-medium">Bowler</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">O</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">M</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">R</th>
                  <th className="text-center p-1.5 text-muted-foreground font-medium w-8">W</th>
                  <th className="text-center p-1.5 pr-3 text-muted-foreground font-medium w-10">Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlingCard.map((bw, bwi) => (
                  <tr key={bwi} className="border-b border-border/30">
                    <td className="p-1.5 pl-3 font-medium">{bw.bowler?.name || "Unknown"}</td>
                    <td className="text-center p-1.5">{bw.o}</td>
                    <td className="text-center p-1.5 text-muted-foreground">{bw.m}</td>
                    <td className="text-center p-1.5">{bw.r}</td>
                    <td className="text-center p-1.5 font-bold text-primary">{bw.w}</td>
                    <td className="text-center p-1.5 pr-3 text-muted-foreground">{bw.eco}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───
const CricketScorecard = () => {
  const [currentMatches, setCurrentMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardInning[]>([]);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [matchInfo, setMatchInfo] = useState<any>(null);

  const fetchMatches = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [currentData, recentData] = await Promise.all([
        callCricketApi("currentMatches", { offset: "0" }),
        callCricketApi("matches", { offset: "0" }),
      ]);

      if (currentData?.data) {
        setCurrentMatches(currentData.data.filter((m: Match) => m.matchStarted && !m.matchEnded));
      }
      if (recentData?.data) {
        setRecentMatches(recentData.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Cricket data load करने में error आया");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchScorecard = async (matchId: string) => {
    setScorecardLoading(true);
    setSelectedMatch(matchId);
    try {
      const [scData, infoData] = await Promise.all([
        callCricketApi("match_scorecard", { id: matchId }),
        callCricketApi("match_info", { id: matchId }),
      ]);
      if (scData?.data) {
        setScorecard(scData.data.scorecard || scData.data || []);
      }
      if (infoData?.data) {
        setMatchInfo(infoData.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Scorecard load करने में error");
    } finally {
      setScorecardLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(() => fetchMatches(true), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Scorecard Detail View ───
  if (selectedMatch) {
    const match = [...currentMatches, ...recentMatches].find((m) => m.id === selectedMatch);

    return (
      <div className="space-y-3 max-w-2xl mx-auto px-1">
        {/* Header */}
        <div className="flex items-center gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mx-1 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => { setSelectedMatch(null); setScorecard([]); setMatchInfo(null); }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-bold truncate">{match?.name || "Match Scorecard"}</h2>
        </div>

        {/* Match Info Card */}
        {matchInfo && (
          <Card className="border-primary/15">
            <CardContent className="p-3">
              <div className="space-y-1.5 text-[11px]">
                {matchInfo.venue && (
                  <div className="flex gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{matchInfo.venue}</span>
                  </div>
                )}
                {matchInfo.date && (
                  <div className="flex gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{matchInfo.date}</span>
                  </div>
                )}
                {match?.status && (
                  <div className="flex gap-2">
                    <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <span className="text-primary font-medium">{match.status}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scorecard */}
        {scorecardLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : scorecard.length > 0 ? (
          <Tabs defaultValue="0" className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="w-max gap-1 h-9">
                {scorecard.map((inn, idx) => (
                  <TabsTrigger key={idx} value={String(idx)} className="text-[10px] px-3 h-7 whitespace-nowrap">
                    {inn.inning?.replace(/ Inning/i, "") || `Inn ${idx + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {scorecard.map((inn, idx) => (
              <TabsContent key={idx} value={String(idx)} className="space-y-3 mt-3">
                <BattingTable battingCard={inn.battingCard} extras={inn.extras} totalScore={inn.totalScore} />
                <BowlingTable bowlingCard={inn.bowlingCard} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Scorecard उपलब्ध नहीं है</p>
          </Card>
        )}
      </div>
    );
  }

  // ─── Match List View ───
  return (
    <div className="space-y-3 max-w-2xl mx-auto px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center border border-green-500/20">
            <Trophy className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display">Cricket Live</h2>
            <p className="text-[10px] text-muted-foreground">Live scores & scorecard</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs px-2.5"
          onClick={() => fetchMatches(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="w-full h-9">
            <TabsTrigger value="live" className="text-xs flex-1 gap-1">
              <Radio className="w-3 h-3" /> Live ({currentMatches.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs flex-1 gap-1">
              <Clock className="w-3 h-3" /> All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-3 space-y-3">
            {currentMatches.length > 0 ? (
              currentMatches.map((m) => <MatchCard key={m.id} match={m} onSelect={fetchScorecard} />)
            ) : (
              <Card className="p-8 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">कोई live match नहीं चल रहा</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-3 space-y-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((m) => <MatchCard key={m.id} match={m} onSelect={fetchScorecard} />)
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No matches found</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CricketScorecard;
