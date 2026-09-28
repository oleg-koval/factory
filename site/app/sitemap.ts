import type { MetadataRoute } from "next";

const routes = [
  "",
  "/proof/",
  "/how-it-works/",
  "/install/",
  "/changelog/",
  "/oleg-koval/",
  "/essays/right-to-say-not-delivered/",
  "/case-studies/terminal-state-mismatch/",
  "/case-studies/development-hydration-warning/",
] as const;

const lastModified: Record<(typeof routes)[number], string> = {
  "": "2026-09-28",
  "/proof/": "2026-09-28",
  "/how-it-works/": "2026-09-23",
  "/install/": "2026-09-28",
  "/changelog/": "2026-09-28",
  "/oleg-koval/": "2026-09-27",
  "/essays/right-to-say-not-delivered/": "2026-09-23",
  "/case-studies/terminal-state-mismatch/": "2026-09-26",
  "/case-studies/development-hydration-warning/": "2026-09-26",
};

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://factory.olegkoval.com${route || "/"}`,
    lastModified: lastModified[route],
    changeFrequency: route === "/changelog/" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/proof/" || route === "/how-it-works/" ? 0.9 : 0.7,
  }));
}
