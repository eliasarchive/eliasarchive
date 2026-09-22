import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  containsSlur,
  fetchLikes,
  fetchViews,
  getVisitorId,
  hasVisitorLiked,
  likeThresholds,
  likeTier,
  remarkForViews,
  submitLike,
  type ArchiveLike,
} from "@/lib/archive-social";

export function ViewBadge({ views }: { views: number | null }) {
  if (views === null) return null;
  return (
    <aside className="view-badge group fixed bottom-12 left-0 z-[80] flex max-w-[52vw] items-center gap-2 border-y border-r border-primary/40 bg-background/80 py-1.5 pl-3 pr-3 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-primary/80 hover:shadow-[0_0_28px_-6px_var(--primary)] md:bottom-16 md:max-w-xs md:py-2 md:pr-4">
      <div className="flex items-center gap-2 text-primary">
        <Eye className="h-4 w-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" strokeWidth={1.4} />
        <span className="font-display text-xl leading-none text-brass-soft">{views.toLocaleString()}</span>
        <span className="text-[7px] uppercase tracking-[.3em] text-muted-foreground">views</span>
      </div>
      <p key={remarkForViews(views)} className="feature-swift mt-0 min-w-0 max-w-48 truncate font-display text-[11px] italic leading-4 text-foreground/70">
        “{remarkForViews(views)}”
      </p>
    </aside>
  );
}

const tierColors = ["var(--legend-8)", "var(--legend-5)", "var(--legend-3)", "var(--legend-2)", "var(--legend-11)"];

export function LikeMeter({ tone }: { tone: (frequency?: number, duration?: number, volume?: number) => void }) {
  const [total, setTotal] = useState<number | null>(null);
  const [liked, setLiked] = useState(true);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const visitorId = getVisitorId();
    void (async () => {
      try {
        const [likes, already] = await Promise.all([fetchLikes(), hasVisitorLiked(visitorId)]);
        if (!active) return;
        setTotal(likes.length);
        setLiked(already || window.localStorage.getItem("elias-archive-liked") === "yes");
      } catch {
        if (active) setTotal(0);
      }
    })();
    return () => { active = false; };
  }, []);

  const tier = likeTier(total ?? 0);
  const color = tierColors[tier.index] ?? tierColors[0]!;

  const publish = async () => {
    if (saving) return;
    if (containsSlur(message)) { setError("That message cannot be published."); return; }
    setSaving(true);
    try {
      await submitLike(getVisitorId(), message.trim().slice(0, 160));
      window.localStorage.setItem("elias-archive-liked", "yes");
      setLiked(true);
      setComposing(false);
      setTotal((value) => (value ?? 0) + 1);
      tone(520, .22, .03);
    } catch {
      setError("Your like could not be recorded.");
      setLiked(true);
    } finally {
      setSaving(false);
    }
  };

  if (total === null) return null;

  return (
    <>
      <aside className="like-meter group fixed right-0 top-1/2 z-[60] flex flex-col items-center gap-2 border-y border-l border-primary/35 bg-background/80 px-2 py-3 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-primary/75 hover:shadow-[0_0_28px_-6px_var(--primary)] md:gap-3 md:px-3 md:py-4" aria-label="Archive appreciation meter">
        <span className="text-[7px] uppercase tracking-[.3em] text-muted-foreground">{total.toLocaleString()}</span>
        <div className="relative h-24 w-2 overflow-hidden rounded-full border border-border bg-card md:h-52 md:w-2.5">
          <div
            className="like-meter-fill absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-[900ms] ease-out"
            style={{ height: `${Math.max(2, tier.progress * 100)}%`, background: color, boxShadow: `0 0 16px ${color}` }}
          />
        </div>
        <span className="text-[7px] uppercase tracking-[.22em] text-muted-foreground">/{tier.target}</span>
        <Button
          aria-label={liked ? "You already left your mark" : "Leave a like and a note"}
          disabled={liked}
          onClick={() => { tone(360, .12, .02); setComposing(true); }}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-primary/50 text-primary transition-transform duration-300 hover:scale-110 disabled:opacity-45"
        >
          <Heart className={liked ? "fill-current" : ""} />
        </Button>
        <span className="text-[6px] uppercase tracking-[.2em] text-muted-foreground">{liked ? "Marked" : "Like"}</span>
      </aside>

      {composing && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/80 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Leave a note">
          <div className="profile-popover-in relative w-full max-w-sm border border-primary/40 bg-card p-6 shadow-2xl">
            <Button aria-label="Close" variant="ghost" size="icon" onClick={() => setComposing(false)} className="absolute right-2 top-2 h-7 w-7 text-muted-foreground"><X /></Button>
            <p className="text-[8px] uppercase tracking-[.35em] text-primary">One note per visitor</p>
            <h3 className="mt-2 font-display text-2xl">Leave your mark</h3>
            <textarea
              value={message}
              maxLength={160}
              onChange={(event) => { setMessage(event.target.value); setError(null); }}
              placeholder="Write something (optional)…"
              className="mt-4 h-24 w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <div className="mt-1 flex items-center justify-between text-[8px] uppercase tracking-[.2em] text-muted-foreground">
              <span className={error ? "text-accent-foreground" : ""}>{error ?? "Offensive language is blocked"}</span>
              <span>{message.length}/160</span>
            </div>
            <Button disabled={saving} onClick={() => void publish()} className="mt-4 w-full uppercase tracking-[.25em]">
              {saving ? "Sending…" : "Publish like"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function DriftingNotes() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState<Array<{ key: string; text: string; top: number; duration: number; reverse: boolean }>>([]);
  const counter = useRef(0);
  const notesRef = useRef<ArchiveLike[]>([]);

  useEffect(() => {
    let active = true;
    void fetchLikes()
      .then((likes) => {
        if (!active) return;
        notesRef.current = likes.filter((like) => like.message && like.message.trim().length > 0);
        setReady(true);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const spawn = useCallback(() => {
    const current = notesRef.current;
    if (current.length === 0) return;
    const pick = current[Math.floor(Math.random() * current.length)]!;
    counter.current += 1;
    const entry = {
      key: `${pick.id}-${counter.current}`,
      text: pick.message ?? "",
      top: 12 + Math.random() * 70,
      duration: 26 + Math.random() * 22,
      reverse: Math.random() > 0.5,
    };
    setVisible((items) => [...items.slice(-5), entry]);
    window.setTimeout(() => setVisible((items) => items.filter((item) => item.key !== entry.key)), entry.duration * 1000);
  }, []);

  useEffect(() => {
    if (!ready) return;
    spawn();
    let timer = 0;
    const tick = () => {
      spawn();
      timer = window.setTimeout(tick, 6000 + Math.random() * 6000);
    };
    timer = window.setTimeout(tick, 6000 + Math.random() * 6000);
    return () => window.clearTimeout(timer);
  }, [ready, spawn]);

  const rendered = useMemo(() => visible, [visible]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {rendered.map((item) => (
        <span
          key={item.key}
          className={item.reverse ? "drift-note drift-note-reverse" : "drift-note"}
          style={{ top: `${item.top}%`, animationDuration: `${item.duration}s` }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
