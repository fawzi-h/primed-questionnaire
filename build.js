/**
 * Production build script — uses esbuild directly.
 *
 * Why not Vite lib mode?  React 18 ships only CommonJS.  Rollup (Vite's build
 * engine) has a known ordering issue where its import-analysis plugin runs
 * before the CJS→ESM transform, causing "default is not exported" errors that
 * are impossible to reliably fix through plugin ordering alone.
 *
 * esbuild understands CJS natively, produces a single IIFE file, inlines data
 * URIs, and is significantly faster.  The Vite dev server (npm start) is
 * unaffected — it uses esbuild for pre-bundling already.
 */

import { build } from "esbuild";
import { readFileSync, mkdirSync } from "fs";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Parse .env ────────────────────────────────────────────────────────────────
function parseEnv(filePath) {
  try {
    const vars = {};
    for (const line of readFileSync(filePath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (/^["']/.test(val)) {
        val = val.replace(/^["']|["']$/g, "");
      } else {
        val = val.replace(/\s+#.*$/, "");
      }
      vars[key] = val;
    }
    return vars;
  } catch {
    return {};
  }
}

const env = parseEnv(resolve(__dirname, ".env"));

// ── define — replaces process.env.* at compile time ──────────────────────────
const define = {
  "process.env.NODE_ENV": '"production"',
  global: "globalThis", // some CJS packages reference `global`
};
for (const [k, v] of Object.entries(env)) {
  if (k.startsWith("REACT_APP_")) {
    define[`process.env.${k}`] = JSON.stringify(v);
  }
}

// ── CSS injection plugin ──────────────────────────────────────────────────────
// Each imported CSS file becomes a small JS snippet that inserts a <style> tag
// BEFORE the first existing stylesheet so host-page CSS always wins the cascade.
const cssInjectPlugin = {
  name: "css-inject",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await readFile(args.path, "utf8");
      return {
        contents: [
          "(function(){",
          '  var s=document.createElement("style");',
          `  s.textContent=${JSON.stringify(css)};`,
          '  var ref=document.head.querySelector("link[rel=\'stylesheet\'],style");',
          "  if(ref)document.head.insertBefore(s,ref);",
          "  else document.head.appendChild(s);",
          "})();",
        ].join(""),
        loader: "js",
      };
    });
  },
};

// ── Build ─────────────────────────────────────────────────────────────────────
mkdirSync(resolve(__dirname, "dist"), { recursive: true });

await build({
  entryPoints: [resolve(__dirname, "src/index.jsx")],
  bundle: true,
  format: "esm",
  outfile: resolve(__dirname, "dist/questionnaire.js"),
  define,
  loader: {
    ".js": "jsx", // CRA-style .js files that contain JSX
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".jpeg": "dataurl",
    ".svg": "dataurl",
    ".gif": "dataurl",
    ".webp": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".ttf": "dataurl",
    ".otf": "dataurl",
  },
  plugins: [cssInjectPlugin],
  minify: true,
  sourcemap: false,
  target: ["es2020"],
  platform: "browser",
});

console.log("✓  dist/questionnaire.js");
