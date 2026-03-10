import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface BlockedWord {
  id: string;
  word: string;
}

interface UserWarning {
  id: string;
  userId: string;
  userEmail: string;
  word: string;
  message: string;
  createdAt: Timestamp | null;
}

interface UserBan {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  bannedAt: Timestamp | null;
  expiresAt: Timestamp | null; // null = permanent
  active: boolean;
  banLevel: number; // 1 = 1hr, 2 = 5hr, 3 = permanent
}

interface ModerationContextType {
  blockedWords: BlockedWord[];
  warnings: UserWarning[];
  bans: UserBan[];
  addBlockedWord: (word: string) => Promise<void>;
  removeBlockedWord: (id: string) => Promise<void>;
  checkMessage: (message: string) => { blocked: boolean; word: string | null };
  recordWarning: (word: string, message: string) => Promise<{ warningCount: number; banned: boolean }>;
  isCurrentUserBanned: () => boolean;
  getBanExpiry: () => Date | null;
  isBanPermanent: () => boolean;
  unbanUser: (banId: string) => Promise<void>;
  adminBanUser: (userEmail: string, reason: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const noop = async () => {};
const ModerationContext = createContext<ModerationContextType>({
  blockedWords: [],
  warnings: [],
  bans: [],
  addBlockedWord: noop,
  removeBlockedWord: noop,
  checkMessage: () => ({ blocked: false, word: null }),
  recordWarning: async () => ({ warningCount: 0, banned: false }),
  isCurrentUserBanned: () => false,
  getBanExpiry: () => null,
  isBanPermanent: () => false,
  unbanUser: noop,
  adminBanUser: noop as any,
  refreshData: noop,
});

export const useModeration = () => useContext(ModerationContext);

export const ModerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [bans, setBans] = useState<UserBan[]>([]);

  const fetchBlockedWords = useCallback(async () => {
    try {
      const wordsSnap = await getDocs(collection(db, "blocked_words"));
      setBlockedWords(wordsSnap.docs.map((d) => ({ id: d.id, word: d.data().word })));
    } catch (err) {
      console.error("Blocked words fetch error:", err);
    }
  }, []);

  const fetchWarnings = useCallback(async () => {
    if (!user) { setWarnings([]); return; }
    try {
      const ref = collection(db, "user_warnings");
      const q = isAdmin ? query(ref) : query(ref, where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserWarning));
      rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setWarnings(rows);
    } catch (err) {
      console.error("Warnings fetch error:", err);
      setWarnings([]);
    }
  }, [user, isAdmin]);

  const fetchBans = useCallback(async () => {
    if (!user) { setBans([]); return; }
    try {
      const ref = collection(db, "user_bans");
      const q = isAdmin ? query(ref) : query(ref, where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserBan));
      rows.sort((a, b) => (b.bannedAt?.toMillis?.() || 0) - (a.bannedAt?.toMillis?.() || 0));
      setBans(rows);
    } catch (err) {
      console.error("Bans fetch error:", err);
      setBans([]);
    }
  }, [user, isAdmin]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchBlockedWords(), fetchWarnings(), fetchBans()]);
  }, [fetchBlockedWords, fetchWarnings, fetchBans]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const addBlockedWord = async (word: string) => {
    await addDoc(collection(db, "blocked_words"), { word: word.toLowerCase().trim() });
    await fetchBlockedWords();
  };

  const removeBlockedWord = async (id: string) => {
    await deleteDoc(doc(db, "blocked_words", id));
    await fetchBlockedWords();
  };

  const checkMessage = (message: string): { blocked: boolean; word: string | null } => {
    const lower = message.toLowerCase();
    for (const bw of blockedWords) {
      if (lower.includes(bw.word.toLowerCase())) {
        return { blocked: true, word: bw.word };
      }
    }
    return { blocked: false, word: null };
  };

  // Get the highest ban level for a user by email
  const getUserBanLevelByEmail = (email: string): number => {
    const userBans = bans.filter((b) => b.userEmail.toLowerCase() === email.toLowerCase());
    if (userBans.length === 0) return 0;
    return Math.max(...userBans.map((b) => b.banLevel || 1));
  };

  const getUserBanLevel = (userId: string): number => {
    const userBans = bans.filter((b) => b.userId === userId);
    if (userBans.length === 0) return 0;
    return Math.max(...userBans.map((b) => b.banLevel || 1));
  };

  const getBanDuration = (banLevel: number): number | null => {
    // Returns milliseconds, null = permanent
    switch (banLevel) {
      case 1: return 60 * 60 * 1000;         // 1 hour
      case 2: return 5 * 60 * 60 * 1000;     // 5 hours
      default: return null;                    // permanent
    }
  };

  const recordWarning = async (word: string, message: string): Promise<{ warningCount: number; banned: boolean }> => {
    if (!user) return { warningCount: 0, banned: false };

    try {
      await addDoc(collection(db, "user_warnings"), {
        userId: user.uid,
        userEmail: user.email || "unknown",
        word,
        message: message.substring(0, 100),
        createdAt: serverTimestamp(),
      });

      const warningsQuery = query(collection(db, "user_warnings"), where("userId", "==", user.uid));
      const warningsSnap = await getDocs(warningsQuery);
      const warningCount = warningsSnap.size;

      // 2 warnings = auto-ban with escalation
      if (warningCount >= 2) {
        const previousBanLevel = getUserBanLevel(user.uid);
        const newBanLevel = previousBanLevel + 1;
        const duration = getBanDuration(newBanLevel);

        const banData: any = {
          userId: user.uid,
          userEmail: user.email || "unknown",
          reason: `Auto-banned: 2 warnings (last word: "${word}")`,
          bannedAt: serverTimestamp(),
          active: true,
          banLevel: newBanLevel,
        };

        if (duration) {
          banData.expiresAt = Timestamp.fromDate(new Date(Date.now() + duration));
        } else {
          banData.expiresAt = null; // permanent
        }

        await addDoc(collection(db, "user_bans"), banData);

        // Clear warnings after ban
        await Promise.all(warningsSnap.docs.map((d) => deleteDoc(doc(db, "user_warnings", d.id))));
        await fetchAll();
        return { warningCount, banned: true };
      }

      await fetchAll();
      return { warningCount, banned: false };
    } catch (err) {
      console.error("recordWarning error:", err);
      return { warningCount: 0, banned: false };
    }
  };

  // Admin can ban any user by email only
  const adminBanUser = async (userEmail: string, reason: string) => {
    if (!isAdmin) throw new Error("Only admin can ban users");
    const email = userEmail.trim().toLowerCase();
    const previousBanLevel = getUserBanLevelByEmail(email);
    const newBanLevel = previousBanLevel + 1;
    const duration = getBanDuration(newBanLevel);

    const banData: any = {
      userId: email, // use email as identifier when admin bans manually
      userEmail: email,
      reason: reason || "Banned by admin",
      bannedAt: serverTimestamp(),
      active: true,
      banLevel: newBanLevel,
    };

    if (duration) {
      banData.expiresAt = Timestamp.fromDate(new Date(Date.now() + duration));
    } else {
      banData.expiresAt = null;
    }

    await addDoc(collection(db, "user_bans"), banData);
    await fetchBans();
  };

  const isCurrentUserBanned = (): boolean => {
    if (!user) return false;
    const now = new Date();
    const email = user.email?.toLowerCase() || "";
    return bans.some((b) => {
      const matchUser = b.userId === user.uid || b.userEmail.toLowerCase() === email;
      if (!matchUser || !b.active) return false;
      if (!b.expiresAt) return true; // permanent
      return b.expiresAt.toDate() > now;
    });
  };

  const isBanPermanent = (): boolean => {
    if (!user) return false;
    const email = user.email?.toLowerCase() || "";
    return bans.some((b) => {
      const match = b.userId === user.uid || b.userEmail.toLowerCase() === email;
      return match && b.active && !b.expiresAt;
    });
  };

  const getBanExpiry = (): Date | null => {
    if (!user) return null;
    const now = new Date();
    const email = user.email?.toLowerCase() || "";
    const activeBan = bans.find((b) => {
      const match = b.userId === user.uid || b.userEmail.toLowerCase() === email;
      if (!match || !b.active) return false;
      if (!b.expiresAt) return true;
      return b.expiresAt.toDate() > now;
    });
    if (!activeBan) return null;
    return activeBan.expiresAt ? activeBan.expiresAt.toDate() : null;
  };

  const unbanUser = async (banId: string) => {
    if (!isAdmin) throw new Error("Only admin can unban users");
    await updateDoc(doc(db, "user_bans", banId), { active: false });
    await fetchBans();
  };

  return (
    <ModerationContext.Provider
      value={{
        blockedWords, warnings, bans,
        addBlockedWord, removeBlockedWord,
        checkMessage, recordWarning,
        isCurrentUserBanned, getBanExpiry, isBanPermanent,
        unbanUser, adminBanUser, refreshData: fetchAll,
      }}
    >
      {children}
    </ModerationContext.Provider>
  );
};
