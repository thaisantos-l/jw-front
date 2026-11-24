import { LegalPage } from "@/components/LegalPage";
import { getSnapshot } from "@/lib/server";
export async function generateMetadata() {
  const page = (await getSnapshot()).data.site.terms;
  return {
    title: page?.title,
    alternates: { canonical: "/termos/" },
    robots: {
      index: Boolean(page) && process.env.SITE_INDEXABLE === "true",
      follow: Boolean(page) && process.env.SITE_INDEXABLE === "true",
    },
  };
}
export default function Page() {
  return <LegalPage kind="terms" />;
}
