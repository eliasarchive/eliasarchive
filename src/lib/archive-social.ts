import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "elias-archive-visitor";

export function getVisitorId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id || id.length < 8) {
    id = `v_${crypto.randomUUID().replace(/-/g, "")}`;
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export async function registerView() {
  const { data, error } = await supabase.rpc("increment_views");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function fetchViews() {
  const { data } = await supabase.from("site_counters").select("value").eq("id", "views").maybeSingle();
  return Number(data?.value ?? 0);
}

export type ArchiveLike = { id: string; message: string | null; created_at: string };

export async function fetchLikes() {
  const { data, error } = await supabase
    .from("archive_likes")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ArchiveLike[];
}

export async function fetchVisitorLike(visitorId: string) {
  const { data } = await supabase
    .from("archive_likes")
    .select("id, message, created_at")
    .eq("visitor_id", visitorId)
    .maybeSingle();
  return (data ?? null) as ArchiveLike | null;
}

export async function hasVisitorLiked(visitorId: string) {
  const { data } = await supabase.from("archive_likes").select("id").eq("visitor_id", visitorId).maybeSingle();
  return Boolean(data);
}

export async function submitLike(visitorId: string, message: string) {
  const { error } = await supabase.from("archive_likes").insert({ visitor_id: visitorId, message: message || null });
  if (error) throw error;
}

// View milestones — a new remark unlocks as the terminal gets more visitors.
export const viewRemarks: Array<{ at: number; text: string }> = [
  { at: 0, text: "I doubt these peasants wander around my terminal at all." },
  { at: 20, text: "Twenty of you. A modest crowd for something this exclusive." },
  { at: 40, text: "Forty. The novelty of my terminal appears to be spreading." },
  { at: 80, text: "Eighty visitors. Still nobody worth remembering." },
  { at: 160, text: "A hundred and sixty. Do try not to touch anything." },
  { at: 320, text: "Three hundred and twenty. I suppose I am rather difficult to ignore." },
  { at: 640, text: "Six hundred and forty. Queue politely, there is only one of me." },
  { at: 1280, text: "Over a thousand. Naturally. Excellence draws an audience." },
];

export function remarkForViews(views: number) {
  let current = viewRemarks[0]!;
  for (const remark of viewRemarks) if (views >= remark.at) current = remark;
  return current.text;
}

export const likeThresholds = [100, 200, 400, 800, 1600];

export function likeTier(total: number) {
  const index = Math.min(likeThresholds.length - 1, likeThresholds.findIndex((value) => total < value) === -1 ? likeThresholds.length - 1 : likeThresholds.findIndex((value) => total < value));
  const target = likeThresholds[index]!;
  const previous = index === 0 ? 0 : likeThresholds[index - 1]!;
  const span = target - previous;
  const progress = Math.max(0, Math.min(1, (total - previous) / span));
  return { index, target, previous, progress };
}

const bannedWords = [
  "nigger", "nigga", "faggot", "fag", "retard", "retarded", "tranny", "chink", "spic", "kike",
  "wetback", "gook", "coon", "dyke", "paki", "beaner", "raghead", "towelhead", "cripple",
];

export function containsSlur(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/\$/g, "s")
    .replace(/[^a-z]/g, "");
  return bannedWords.some((word) => normalized.includes(word));
}
