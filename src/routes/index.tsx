import { createFileRoute } from "@tanstack/react-router";
import { EliasExperience } from "@/components/elias-experience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elias Archer — Private Archive" },
      { name: "description", content: "Enter Elias Archer's cinematic private archive through the manor." },
      { property: "og:title", content: "Elias Archer — Private Archive" },
      { property: "og:description", content: "Enter Elias Archer's cinematic private archive through the manor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <EliasExperience />;
}