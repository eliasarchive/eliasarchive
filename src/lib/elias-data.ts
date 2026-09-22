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
  { id: "hair", label: "Hair", detail: "Tousled blonde hair with layered, pointed strands framing the face.", x: 50, y: 14, side: "left" },
  { id: "eyes", label: "Eyes", detail: "Almond-shaped eyes.", x: 46, y: 29, side: "left" },
  { id: "glasses", label: "Glasses", detail: "Low-set, dark-rimmed glasses.", x: 54, y: 31, side: "right" },
  { id: "skin", label: "Skin tone", detail: "Lightly tanned skin tone.", x: 50, y: 38, side: "right" },
  { id: "face", label: "Face", detail: "An arrogant look on his face.", x: 48, y: 35, side: "left" },
  { id: "build", label: "Body / build", detail: "Lean and athletic.", x: 48, y: 60, side: "left" },
  { id: "uniform", label: "Uniform", detail: "Kitagawa High uniform.", x: 48, y: 51, side: "right" },
  { id: "armband", label: "Prefect armband", detail: "As part of the prefect programme, Elias Archer wears the armband to show it.", x: 75, y: 47, side: "right" },
  { id: "belt", label: "Belt", detail: "Louis V belt.", x: 51, y: 67, side: "right" },
] as const;

export type ArchiveSection = "relationships" | "appearance" | "backstory";