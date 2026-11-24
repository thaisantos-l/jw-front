import type { Metadata } from "next";
import localFont from "next/font/local";
import { ContentProvider } from "@/components/ContentProvider";
import { Header, Footer } from "@/components/Chrome";
import { endpoints, getSnapshot, siteUrl } from "@/lib/server";
import "./globals.scss";

const sora = localFont({
  src: "../assets/fonts/sora-latin-variable.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "100 800",
});
const inter = localFont({
  src: "../assets/fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getSnapshot();
  const identity = data.site.identity;
  return {
    metadataBase: siteUrl(),
    title: identity.seoTitle || identity.name,
    description: identity.seoDescription || undefined,
    robots: {
      index: process.env.SITE_INDEXABLE === "true",
      follow: process.env.SITE_INDEXABLE === "true",
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title: identity.seoTitle || identity.name,
      description: identity.seoDescription || undefined,
      images: identity.socialImage
        ? [
            {
              url: identity.socialImage.src,
              width: identity.socialImage.width,
              height: identity.socialImage.height,
              alt: identity.socialImage.alt,
            },
          ]
        : [],
    },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initial = await getSnapshot();
  return (
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <ContentProvider initial={initial} endpoint={endpoints().content}>
          <Header />
          {children}
          <Footer />
        </ContentProvider>
      </body>
    </html>
  );
}
