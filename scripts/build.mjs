import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  cp,
  symlink,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { parseSnapshot } from "../src/lib/content.ts";
import { replaceExport } from "./export-output.mjs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
else if (existsSync(".env")) process.loadEnvFile(".env");
const graphql = new URL(process.env.WORDPRESS_GRAPHQL_URL || "");
if (
  graphql.username ||
  graphql.password ||
  !graphql.pathname.endsWith("/graphql") ||
  graphql.search ||
  graphql.hash ||
  !(
    graphql.protocol === "https:" ||
    (graphql.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(graphql.hostname))
  )
)
  throw new Error("WORDPRESS_GRAPHQL_URL inválida");
const endpoint = graphql.href.slice(0, -7) + "wp-json/jw/v1/site-content";
const response = await fetch(endpoint, {
  cache: "no-store",
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error(`CMS indisponível: HTTP ${response.status}`);
const snapshot = parseSnapshot(await response.json());
if (!snapshot) throw new Error("Contrato de conteúdo inválido.");
const canonical = JSON.stringify(snapshot.data)
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
if (createHash("sha256").update(canonical).digest("hex") !== snapshot.digest)
  throw new Error("Digest do CMS não confere.");
await mkdir(".cache", { recursive: true });
await writeFile(".cache/build-snapshot.json", JSON.stringify(snapshot));
// Static export treats distDir as the export destination. A separate working
// directory also isolates Next's internal cache from the running dev server.
const root = process.cwd();
const workspace = await mkdtemp(path.join(root, ".cache", "build-"));
for (const entry of [
  "src",
  "public",
  "next.config.mjs",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
]) {
  await cp(path.join(root, entry), path.join(workspace, entry), {
    recursive: true,
  });
}
await mkdir(path.join(workspace, ".cache"));
await writeFile(
  path.join(workspace, ".cache", "build-snapshot.json"),
  JSON.stringify(snapshot),
);
await symlink(
  path.join(root, "node_modules"),
  path.join(workspace, "node_modules"),
  process.platform === "win32" ? "junction" : "dir",
);
const result = spawnSync(
  process.execPath,
  [path.join(root, "node_modules/next/dist/bin/next"), "build"],
  {
    cwd: workspace,
    stdio: "inherit",
    env: { ...process.env, JW_BUILD: "1", JW_PROJECT_ROOT: root },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
const index = await readFile(path.join(workspace, "out/index.html"));
const manifest = {
  schemaVersion: 1,
  builtAt: new Date().toISOString(),
  contentRevision: snapshot.revision,
  contentDigest: snapshot.digest,
  contractSha256: createHash("sha256")
    .update(await readFile("src/lib/jw-home.graphql"))
    .digest("hex"),
  indexSha256: createHash("sha256").update(index).digest("hex"),
};
await writeFile(
  path.join(workspace, "out/build-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
const verify = spawnSync(
  process.execPath,
  [path.join(root, "scripts/verify-export.mjs")],
  {
    cwd: workspace,
    stdio: "inherit",
  },
);
if (verify.status !== 0) process.exit(verify.status || 1);
await replaceExport(path.join(workspace, "out"), root);
console.log("Build concluído em out/. Nenhum deploy foi executado.");
