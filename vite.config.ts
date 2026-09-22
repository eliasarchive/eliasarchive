// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages builds set GITHUB_PAGES=true in the workflow. In that mode the site
// is prerendered to plain static files (no server) and served from
// https://<user>.github.io/<repo>/, so the asset base must include the repo name.
const isGithubPages = process.env["GITHUB_PAGES"] === "true";
const repo = (process.env["GITHUB_REPOSITORY"] ?? "").split("/")[1] ?? "";
const base =
  process.env["BASE_PATH"] ??
  (isGithubPages && repo && !repo.endsWith(".github.io") ? `/${repo}/` : "/");

export default defineConfig({
  vite: isGithubPages ? { base } : {},
  // GitHub Pages serves plain files, so skip the server bundle and just prerender.
  ...(isGithubPages ? { nitro: false as const } : {}),
  tanstackStart: isGithubPages
    ? {
        server: { entry: "server" },
        prerender: { enabled: true, crawlLinks: true },
      }
    : {
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        // nitro/vite builds from this
        server: { entry: "server" },
      },
});

