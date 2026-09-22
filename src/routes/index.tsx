import { createFileRoute } from "@tanstack/react-router";
import { EliasExperience } from "@/components/elias-experience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elias Archer's Archive" },
      { name: "description", content: "╰ˋˋ→ 💎┃ Get a glimpse while you can, pfft. - MADE BY @safffffffr" },
      { property: "og:title", content: "Elias Archer's Archive" },
      { property: "og:description", content: "╰ˋˋ→ 💎┃ Get a glimpse while you can, pfft. - MADE BY @safffffffr" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <EliasExperience />;
}
