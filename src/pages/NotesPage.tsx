import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus, Trash2, Search, Pin } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  color: string;
  createdAt: number;
}

const colors = [
  "border-primary/30",
  "border-secondary/30",
  "border-accent/30",
  "border-muted-foreground/20",
];

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("ai-hub-notes");
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("ai-hub-notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "",
      content: "",
      pinned: false,
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setEditingId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted");
  };

  const togglePin = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const filtered = notes
    .filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.pinned === b.pinned ? b.createdAt - a.createdAt : a.pinned ? -1 : 1));

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold gradient-text flex items-center gap-2 font-display tracking-wide">
          <StickyNote className="w-5 h-5" /> Notes
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="bg-muted/30 pl-9 h-9"
            />
          </div>
          <Button onClick={addNote} className="h-9 shrink-0">
            <Plus className="w-4 h-4 mr-2" /> New Note
          </Button>
        </div>
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote className="w-16 h-16 mx-auto text-primary/10 mb-4" />
          <p className="text-sm text-muted-foreground">
            {notes.length === 0 ? "No notes yet. Create your first note!" : "No notes match your search"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className={`glass-card ${note.color} hover:shadow-lg transition-all duration-300 cursor-pointer group`}
              onClick={() => setEditingId(editingId === note.id ? null : note.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Note title..."
                    className="bg-transparent border-0 p-0 h-auto text-sm font-semibold focus-visible:ring-0 text-foreground"
                  />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                      className={`p-1 rounded hover:bg-muted/30 ${note.pinned ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {editingId === note.id ? (
                  <Textarea
                    value={note.content}
                    onChange={(e) => updateNote(note.id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Write your note..."
                    className="bg-muted/10 border-border text-sm min-h-[100px] resize-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-4 min-h-[40px]">
                    {note.content || "Empty note..."}
                  </p>
                )}

                <p className="text-[10px] text-muted-foreground/50">
                  {new Date(note.createdAt).toLocaleDateString()}
                  {note.pinned && <span className="ml-2 text-primary">📌 Pinned</span>}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPage;
