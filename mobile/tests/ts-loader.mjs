import { access } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:") &&
    !/\.[a-z0-9]+$/i.test(specifier)
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    for (const ext of EXTENSIONS) {
      const candidate = resolvePath(parentDir, `${specifier}${ext}`);
      try {
        await access(candidate);
        return nextResolve(pathToFileURL(candidate).href, context);
      } catch {
        // Try next candidate extension.
      }
    }
  }
  return nextResolve(specifier, context);
}
