import "server-only";
import { readFile } from "node:fs/promises";
import { cache } from "react";
import { parseSnapshot, type Snapshot } from "./content";

export function endpoints() {
  const raw = process.env.WORDPRESS_GRAPHQL_URL;
  if (!raw) throw new Error("Configure WORDPRESS_GRAPHQL_URL.");
  const url = new URL(raw);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.endsWith("/graphql") ||
    !(
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname))
    )
  )
    throw new Error("WORDPRESS_GRAPHQL_URL inválida.");
  const base = url.href.slice(0, -"graphql".length);
  return {
    content: base + "wp-json/jw/v1/site-content",
    contact: base + "wp-json/jw/v1/contact",
  };
}

export const getSnapshot = cache(async (): Promise<Snapshot> => {
  let input: unknown;
  if (process.env.JW_BUILD === "1") {
    input = JSON.parse(await readFile(".cache/build-snapshot.json", "utf8"));
  } else {
    const response = await fetch(endpoints().content, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error("CMS indisponível. Verifique o WAMP e o plugin JW Core.");
    input = await response.json();
  }
  const snapshot = parseSnapshot(input);
  if (!snapshot)
    throw new Error(
      "O CMS retornou conteúdo incompatível com o contrato JWHome.",
    );
  return snapshot;
});

export function siteUrl() {
  return new URL(process.env.SITE_URL || "http://127.0.0.1:3001");
}
