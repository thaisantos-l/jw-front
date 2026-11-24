import path from "node:path";
import { cp, mkdir, readdir, lstat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

async function files(root, relative = "") {
  const output = [];
  for (const entry of await readdir(path.join(root, relative), {
    withFileTypes: true,
  })) {
    if (entry.isSymbolicLink())
      throw new Error("Links não são permitidos no export.");
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) output.push(...(await files(root, name)));
    else output.push(name);
  }
  return output;
}

/** Copy verified output without renaming directories watched by Windows dev tools. */
export async function replaceExport(source, root) {
  root = path.resolve(root);
  source = path.resolve(source);
  const destination = path.join(root, "out");
  if (!source.startsWith(path.join(root, ".cache") + path.sep))
    throw new Error("Fonte fora do cache do projeto.");
  const incoming = new Set(await files(source));
  if (!incoming.has("build-manifest.json") || !incoming.has("index.html"))
    throw new Error("Export incompleto.");
  if (existsSync(destination)) {
    if ((await lstat(destination)).isSymbolicLink())
      throw new Error("Destino não pode ser um link.");
    const previous = await files(destination);
    if (previous.length && !previous.includes("build-manifest.json"))
      throw new Error(
        "O diretório out contém arquivos sem manifesto; preserve-os antes de gerar o export.",
      );
    if (previous.length)
      await cp(
        destination,
        path.join(root, ".cache", `previous-export-${Date.now()}`),
        { recursive: true },
      );
    for (const relative of previous) {
      const target = path.resolve(destination, relative);
      if (!target.startsWith(destination + path.sep))
        throw new Error("Arquivo fora do export.");
      if (!incoming.has(relative)) await unlink(target);
    }
  }
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
}
