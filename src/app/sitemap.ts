import type { MetadataRoute } from "next";
import { getSnapshot, siteUrl } from "@/lib/server";
export const dynamic = "force-static";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await getSnapshot();
  return [
    "/",
    ...(data.site.privacy ? ["/privacidade/"] : []),
    ...(data.site.terms ? ["/termos/"] : []),
  ].map((path) => ({ url: new URL(path, siteUrl()).href }));
}
