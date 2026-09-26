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
];

const lastModified: Record<string, string> = {
  "": "2026-09-26",
  "/oleg-koval/": "2026-09-24",
  "/case-studies/development-hydration-warning/": "2026-09-26",
};

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://factory.olegkoval.com${route || "/"}`,
    lastModified: lastModified[route] ?? "2026-09-23",
    changeFrequency: route === "/changelog/" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/proof/" || route === "/how-it-works/" ? 0.9 : 0.7,
  }));
}
