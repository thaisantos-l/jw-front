import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/server";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(process.env.SITE_INDEXABLE === "true"
        ? { allow: "/" }
        : { disallow: "/" }),
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
