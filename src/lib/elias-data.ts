export const elias = {
  name: "Elias Archer",
  pronouns: "He/Him",
  height: "6'2\".",
  language: "English / Japanese",
  school: "Kitagawa High",
  background: 'London-born child heir of "Archer Bionat"',
  programme: "Part of the prefect programme",
} as const;

export const relationshipTypes = [
  "Hatred",
  "Friendship",
  "Complicated",
  "Trust",
  "Romantic Love",
  "Respect / Admiration",
  "Family",
  "Distrust",
  "Crush",
  "Rivalry",
  "Acquaintance / Distant",
  "Mentor / Guidance",
] as const;

export const appearanceFeatures = [
  { id: "hair", label: "Hair", detail: "Tousled blonde hair with layered, pointed strands framing the face.", x: 46, y: 11, side: "left" },
  { id: "eyes", label: "Eyes", detail: "Almond-shaped eyes.", x: 42.5, y: 25, side: "left" },
  { id: "glasses", label: "Glasses", detail: "Low-set, dark-rimmed glasses.", x: 55.5, y: 27.5, side: "right" },
  { id: "skin", label: "Skin tone", detail: "Lightly tanned skin tone.", x: 53, y: 40.5, side: "right" },
  { id: "face", label: "Face", detail: "An arrogant look on his face.", x: 47, y: 31.5, side: "left" },
  { id: "build", label: "Body / build", detail: "Lean and athletic.", x: 43, y: 78, side: "left" },
  { id: "uniform", label: "Uniform", detail: "Kitagawa High uniform.", x: 26, y: 48, side: "left" },
  { id: "armband", label: "Prefect armband", detail: "As part of the prefect programme, Elias Archer wears the armband to show it.", x: 84, y: 52.5, side: "right" },
  { id: "belt", label: "Belt", detail: "Louis V belt.", x: 45, y: 65, side: "right" },
] as const;

export type ArchiveSection = "relationships" | "appearance" | "backstory";