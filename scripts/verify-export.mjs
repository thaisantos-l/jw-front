import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
const html = await readFile("out/index.html", "utf8");
const manifest = JSON.parse(await readFile("out/build-manifest.json", "utf8"));
if (manifest.indexSha256 !== createHash("sha256").update(html).digest("hex"))
  throw new Error("HTML não corresponde ao manifesto.");
if (
  /figma\.com\/api\/mcp\/asset|wp-config\.php|WP_MAIL_SMTP_PASSWORD/.test(html)
)
  throw new Error("Export contém referência proibida.");
for (const path of new Set(
  [...html.matchAll(/(?:src|href)="(\/_next\/[^"?]+)(?:\?[^"<>]*)?"/g)].map(
    (m) => m[1],
  ),
)) {
  if (!(await stat("out" + path)).isFile())
    throw new Error("Asset ausente: " + path);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
if (new Set(ids).size !== ids.length)
  throw new Error("IDs duplicados no HTML.");
for (const page of ["privacidade", "termos"])
  if (!(await stat(`out/${page}/index.html`)).isFile())
    throw new Error("Página legal ausente.");
console.log("Export verificado: manifesto, assets, IDs e páginas.");
