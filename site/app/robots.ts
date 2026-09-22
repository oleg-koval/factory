import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://factory.olegkoval.com/sitemap.xml",
    host: "https://factory.olegkoval.com",
  };
}
