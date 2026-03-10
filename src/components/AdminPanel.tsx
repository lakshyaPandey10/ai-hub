import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Send, Trash2, Shield, Ban, ShieldOff, AlertTriangle, MessageSquareOff, Plus, UserX, UserCheck, Gavel } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useModeration } from "@/contexts/ModerationContext";

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: any;
}

const AdminPanel = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [banEmail, setBanEmail] = useState("");
  const [banReason, setBanReason] = useState("");

  const { blockedWords, warnings, bans, addBlockedWord, removeBlockedWord, unbanUser, adminBanUser } = useModeration();

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
    } catch {
      try {
        const snap = await getDocs(collection(db, "announcements"));
        setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
      } catch {
        toast.error("Failed to load announcements");
      }
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const postAnnouncement = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Fill both fields"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "announcements"), { title: title.trim(), message: message.trim(), createdAt: serverTimestamp() });
      setTitle(""); setMessage("");
      toast.success("Announcement posted! 📢");
      fetchAnnouncements();
    } catch { toast.error("Post failed"); }
    setLoading(false);
  };

  const deleteAnnouncement = async (id: string) => {
    try { await deleteDoc(doc(db, "announcements", id)); toast.success("Deleted!"); fetchAnnouncements(); }
    catch { toast.error("Delete failed"); }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) { toast.error("Enter a word"); return; }
    try {
      await addBlockedWord(newWord);
      setNewWord("");
      toast.success(`"${newWord}" blocked! 🚫`);
    } catch { toast.error("Failed to add word"); }
  };

  const handleUnban = async (banId: string) => {
    try { await unbanUser(banId); toast.success("User unbanned! ✅"); }
    catch { toast.error("Unban failed"); }
  };

  const handleManualBan = async () => {
    if (!banEmail.trim()) {
      toast.error("Enter user's Gmail/Email");
      return;
    }
    try {
      await adminBanUser(banEmail.trim(), banReason.trim());
      setBanEmail(""); setBanReason("");
      toast.success("User banned! 🔨");
    } catch { toast.error("Ban failed"); }
  };

  const now = new Date();
  const activeBans = bans.filter(b => {
    if (!b.active) return false;
    if (!b.expiresAt) return true; // permanent
    return b.expiresAt.toDate() > now;
  });

  const getBanTypeLabel = (ban: any) => {
    if (!ban.expiresAt) return "🔴 PERMANENT";
    const level = ban.banLevel || 1;
    if (level === 1) return "⏱️ 1 Hour";
    if (level === 2) return "⏱️ 5 Hours";
    return "🔴 PERMANENT";
  };

  return (
    <Card className="glass-card neon-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-accent" /> Admin Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="announcements" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30 h-10">
            <TabsTrigger value="announcements" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Megaphone className="w-3 h-3 mr-1" /> Announce
            </TabsTrigger>
            <TabsTrigger value="words" className="text-xs data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
              <MessageSquareOff className="w-3 h-3 mr-1" /> Words
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
              <UserX className="w-3 h-3 mr-1" /> Bans
            </TabsTrigger>
            <TabsTrigger value="manual-ban" className="text-xs data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
              <Gavel className="w-3 h-3 mr-1" /> Ban User
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/20 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> New Announcement</h3>
              <Input placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/50" />
              <Textarea placeholder="Message..." value={message} onChange={(e) => setMessage(e.target.value)} className="bg-muted/50" />
              <Button onClick={postAnnouncement} disabled={loading} className="w-full bg-primary/20 text-primary hover:bg-primary/30">
                <Send className="w-4 h-4 mr-2" /> {loading ? "Posting..." : "Post"}
              </Button>
            </div>
            {announcements.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg bg-muted/20 flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-semibold">{a.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                      </div>
                      <Button onClick={() => deleteAnnouncement(a.id)} size="icon" variant="ghost" className="text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>}
          </TabsContent>

          {/* Blocked Words Tab */}
          <TabsContent value="words" className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/20 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Ban className="w-4 h-4 text-destructive" /> Block a Word</h3>
              <div className="flex gap-2">
                <Input placeholder="Enter word to block..." value={newWord} onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddWord()} className="bg-muted/50" />
                <Button onClick={handleAddWord} size="icon" className="bg-destructive/20 text-destructive hover:bg-destructive/30 shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {blockedWords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {blockedWords.map((w) => (
                  <div key={w.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs">
                    <span className="text-destructive font-medium">{w.word}</span>
                    <button onClick={() => removeBlockedWord(w.id)} className="text-destructive/60 hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No blocked words</p>}

            {warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Recent Warnings</h3>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {warnings.map((w) => (
                      <div key={w.id} className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-xs">
                        <span className="font-medium text-foreground">{w.userEmail}</span>
                        <span className="text-muted-foreground"> used "</span>
                        <span className="text-destructive font-semibold">{w.word}</span>
                        <span className="text-muted-foreground">"</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Bans Tab */}
          <TabsContent value="users" className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><UserX className="w-4 h-4 text-destructive" /> Active Bans</h3>
            {activeBans.length > 0 ? (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {activeBans.map((b) => (
                    <div key={b.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/15 flex justify-between items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.userEmail}</p>
                        <p className="text-[11px] text-muted-foreground">{b.reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20">
                            {getBanTypeLabel(b)}
                          </span>
                          {b.expiresAt && (
                            <p className="text-[10px] text-destructive">
                              Expires: {b.expiresAt.toDate().toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => handleUnban(b.id)} size="sm" variant="outline"
                        className="border-green-500/30 text-green-500 hover:bg-green-500/10 shrink-0">
                        <UserCheck className="w-3 h-3 mr-1" /> Unban
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <ShieldOff className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No active bans</p>
              </div>
            )}

            {bans.filter(b => !b.active || (b.expiresAt && b.expiresAt.toDate() <= now)).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground">Past Bans</h3>
                {bans.filter(b => !b.active || (b.expiresAt && b.expiresAt.toDate() <= now)).map((b) => (
                  <div key={b.id} className="p-2 rounded-lg bg-muted/10 text-xs text-muted-foreground">
                    {b.userEmail} — {b.reason}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Manual Ban Tab */}
          <TabsContent value="manual-ban" className="space-y-4">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/15 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Gavel className="w-4 h-4 text-destructive" /> Ban Any User</h3>
              <p className="text-[11px] text-muted-foreground">Ban escalates: 1st = 1 hour, 2nd = 5 hours, 3rd+ = permanent</p>
              <Input placeholder="User Gmail / Email" value={banEmail} onChange={(e) => setBanEmail(e.target.value)} className="bg-muted/50" />
              <Input placeholder="Reason (optional)" value={banReason} onChange={(e) => setBanReason(e.target.value)} className="bg-muted/50" />
              <Button onClick={handleManualBan} className="w-full bg-destructive/20 text-destructive hover:bg-destructive/30">
                <Gavel className="w-4 h-4 mr-2" /> Ban User
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
