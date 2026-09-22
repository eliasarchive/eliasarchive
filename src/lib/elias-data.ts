export const elias = {
  name: "Elias Archer",
  pronouns: "He/Him",
  height: "6'2\".",
  language: "English",
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
  { id: "hair", label: "Hair", detail: "Blonde hair.", x: 50, y: 14, side: "left" },
  { id: "eyes", label: "Eyes", detail: "Almond-shaped eyes.", x: 46, y: 29, side: "left" },
  { id: "glasses", label: "Glasses", detail: "Glasses.", x: 54, y: 31, side: "right" },
  { id: "skin", label: "Skin tone", detail: "Medium skin tone.", x: 50, y: 38, side: "right" },
  { id: "face", label: "Face", detail: "No additional details recorded.", x: 48, y: 35, side: "left" },
  { id: "height", label: "Height", detail: "6'2\".", x: 28, y: 63, side: "left" },
  { id: "build", label: "Body / build", detail: "Tall, block-formed proportions visible in the image.", x: 48, y: 60, side: "left" },
  { id: "uniform", label: "Uniform", detail: "Black school uniform.", x: 48, y: 51, side: "right" },
  { id: "armband", label: "Prefect armband", detail: "Prefect armband.", x: 75, y: 47, side: "right" },
  { id: "accessories", label: "Accessories", detail: "Glasses and a dark patterned belt are visible.", x: 51, y: 67, side: "right" },
  { id: "style", label: "Overall style", detail: "A monochrome school uniform with a contrasting prefect armband.", x: 54, y: 78, side: "right" },
] as const;

export type ArchiveSection = "relationships" | "appearance" | "backstory";