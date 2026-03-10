import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Megaphone, X, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  message: string;
}

const AnnouncementsBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const prevAnnouncementsRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    const fetchAnn = async () => {
      try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const newAnn = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        
        // Check for new announcements and send notification
        if (notificationsEnabled && prevAnnouncementsRef.current.length > 0) {
          const newIds = newAnn.filter(a => !prevAnnouncementsRef.current.includes(a.id));
          newIds.forEach(a => {
            new Notification("AI Hub — New Announcement", {
              body: `${a.title}: ${a.message}`,
              icon: "/favicon.ico",
            });
          });
        }
        prevAnnouncementsRef.current = newAnn.map(a => a.id);
        setAnnouncements(newAnn);
      } catch {
        const snap = await getDocs(collection(db, "announcements"));
        const newAnn = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        prevAnnouncementsRef.current = newAnn.map(a => a.id);
        setAnnouncements(newAnn);
      }
    };
    fetchAnn();
    // Poll every 30 seconds for new announcements
    const interval = setInterval(fetchAnn, 30000);
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser notifications supported nahi hai");
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(notificationsEnabled ? "Notifications off" : "Notifications on 🔔");
    } else if (Notification.permission === "denied") {
      toast.error("Notifications blocked hain — browser settings se allow karo");
    } else {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotificationsEnabled(true);
        toast.success("Notifications enabled! 🔔");
      } else {
        toast.error("Notifications allow nahi hui");
      }
    }
  };

  const visible = announcements.filter((a) => !dismissed.includes(a.id)).slice(0, 3);
  if (visible.length === 0 && announcements.length === 0) return null;

  return (
    <div className="space-y-2 animate-slide-up">
      {/* Notification toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNotifications}
          className="text-muted-foreground hover:text-primary h-7 px-2 text-[10px] gap-1"
        >
          {notificationsEnabled ? <Bell className="w-3 h-3 text-primary" /> : <BellOff className="w-3 h-3" />}
          {notificationsEnabled ? "Notifications On" : "Enable Notifications"}
        </Button>
      </div>
      {visible.map((a) => (
        <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl bg-accent/8 border border-accent/15 group hover:border-accent/30 transition-all">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
          </div>
          <button
            onClick={() => setDismissed((prev) => [...prev, a.id])}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsBanner;
