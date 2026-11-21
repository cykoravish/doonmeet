#!/usr/bin/env node
// Supply-chain guard — stops `npm run dev` / `npm run build` and the deploy
// workflow when the repo contains signs of injected code.
//
// Why: in Sep 2026 this repo was hit by the PolinRider malware campaign
// (obfuscated JavaScript hidden after a long run of spaces at the end of
// next.config.ts, postcss.config.mjs and server.ts, force-pushed to main and
// auto-deployed). Related waves hide the payload in fake font files run by a
// VS Code task on folder open, or in invisible Unicode characters.
//
// It only READS files — nothing it scans is ever executed.
// Usage: node scripts/check-injection.mjs [--root <dir>]

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const argRoot = process.argv.indexOf("--root");
const ROOT = argRoot > -1 ? path.resolve(process.argv[argRoot + 1]) : path.resolve(path.dirname(SELF), "..");
const SELF_REL = path.relative(ROOT, SELF).split(path.sep).join("/");

const MAX_LINE = 1000; // no hand-written source line here comes close
const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|bmp|mp4|webm|mp3|wav|ogg|pdf|zip|gz|tgz|woff2?|ttf|otf|eot)$/i;
const SKIP_FILES = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;
const NO_LENGTH_CHECK = /\.(svg|map)$|\.min\.(js|css)$/i;
const CODE = /\.(c|m)?(j|t)sx?$|\.json$/i;
// Files Node or a build tool executes directly — they have no business decoding/eval'ing strings.
const ENTRY = /(^|\/)((next|postcss|tailwind|eslint|vite|babel|jest|vitest)\.config\.(c|m)?(j|t)s|server\.(t|j)s|proxy\.ts|middleware\.ts|instrumentation\.ts)$/;

// Strings seen in PolinRider samples (incl. the one found in this repo).
// Kept split so this file doesn't match itself.
const MARKERS = [
  ["global['", "!']"], ['global["', '!"]'], ["global['", "_V']"], ["global.", "o='"], ["global.", "i = '"],
  ["_$_", "1e42"], ["_$_", "376e"], ["rmcej", "%otb%"], ["Cot%3t", "=shtP"], ["function ", "MDy("],
  ["api.", "trongrid.io"], ["aptos", "labs.com"], ["bsc-", "dataseed"], ["eth.", "blockscout.com"],
  ["hello", "ipbot"], ["dmFyIF8k", "Xz"], // base64 of `var _$_`
].map((parts) => parts.join(""));
const OBFUSCATOR = /var _\$_[0-9a-f]{4}\s*=\s*\(function/;
const EVAL_DECODE = /\beval\s*\(\s*["'`]?[^)]{0,40}\batob\s*\(/;
const ENTRY_BAD = /\beval\s*\(|\batob\s*\(|new\s+Function\s*\(|\bcreateRequire\b|\bglobal(This)?\s*\[/;
const WS_PAD = /\S[ \t]{100,}\S/;
const BIDI = /[\u202A-\u202E\u2066-\u2069]/;
const INVISIBLE_RUN = /[\u200B-\u200D\u2060-\u2064\uFE00-\uFE0F]{3,}/;
const VS_SUPPLEMENT = /\uDB40[\uDD00-\uDDEF]/; // U+E0100-E01EF, used to smuggle code
const LIFECYCLE = ["preinstall", "install", "postinstall", "prepare", "preprepare", "postprepare", "prepublish"];

const problems = [];
const report = (file, line, why) => problems.push(`  ${file}${line ? `:${line}` : ""}  ${why}`);
const lineOf = (text, index) => text.slice(0, index).split("\n").length;

function listFiles() {
  try {
    const out = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const files = out.split("\0").filter(Boolean);
    if (files.length) return files;
  } catch {
    // not a git checkout — fall back to walking the folder
  }
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (["node_modules", ".git", ".next", "dist", "build", "coverage"].includes(e.name)) continue;
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) walk(rel);
      else if (e.isFile()) files.push(rel);
    }
  };
  walk("");
  return files;
}

function checkFont(rel, buf) {
  const head = buf.subarray(0, 4).toString("latin1");
  const ext = rel.slice(rel.lastIndexOf(".") + 1).toLowerCase();
  const ok =
    ext === "woff2" ? head === "wOF2"
    : ext === "woff" ? head === "wOFF"
    : ext === "otf" ? head === "OTTO"
    : ext === "ttf" ? head === "\x00\x01\x00\x00" || head === "true" || head === "OTTO"
    : ext === "eot" ? buf.subarray(34, 36).toString("latin1") === "LP"
    : true;
  if (!ok) report(rel, 0, "not a real font file (wrong magic bytes) — possibly JavaScript disguised as a font");
}

function checkText(rel, text) {
  const base = rel.slice(rel.lastIndexOf("/") + 1);

  if (!NO_LENGTH_CHECK.test(rel)) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > MAX_LINE) {
        report(rel, i + 1, `line is ${lines[i].length} characters long`);
        break;
      }
    }
    const pad = WS_PAD.exec(text);
    if (pad) report(rel, lineOf(text, pad.index), "code hidden after a long run of whitespace");
  }

  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (const [re, why] of [
    [BIDI, "bidirectional control character (Trojan Source)"],
    [INVISIBLE_RUN, "run of invisible Unicode characters"],
    [VS_SUPPLEMENT, "invisible variation-selector characters (used to hide code)"],
  ]) {
    const m = re.exec(body);
    if (m) report(rel, lineOf(body, m.index), why);
  }

  if (CODE.test(rel) && rel !== SELF_REL) {
    for (const marker of MARKERS) {
      const at = text.indexOf(marker);
      if (at > -1) report(rel, lineOf(text, at), `known malware marker ${JSON.stringify(marker)}`);
    }
    const ob = OBFUSCATOR.exec(text) || EVAL_DECODE.exec(text);
    if (ob) report(rel, lineOf(text, ob.index), "obfuscated eval/decoder pattern");
  }

  if (ENTRY.test(rel)) {
    const m = ENTRY_BAD.exec(text);
    if (m) report(rel, lineOf(text, m.index), `"${m[0].trim()}" in a file the build/server executes directly`);
  }

  if (/(^|\/)\.vscode\/tasks\.json$/.test(rel) && /"runOn"\s*:\s*"folderOpen"/.test(text)) {
    report(rel, 0, 'VS Code task with "runOn": "folderOpen" (runs automatically when the folder is opened)');
  }

  if (base === "package.json" && !rel.includes("node_modules/")) {
    try {
      const scripts = JSON.parse(text).scripts ?? {};
      for (const name of LIFECYCLE) {
        if (scripts[name]) report(rel, 0, `install-time lifecycle script "${name}" (${String(scripts[name]).slice(0, 60)})`);
      }
    } catch {
      report(rel, 0, "package.json is not valid JSON");
    }
  }
}

const files = listFiles();
let checked = 0;
for (const rel of files) {
  if (SKIP_FILES.test(rel)) continue;
  const abs = path.join(ROOT, rel);
  let size;
  try {
    const st = statSync(abs);
    if (!st.isFile()) continue;
    size = st.size;
  } catch {
    continue; // deleted in the working tree
  }
  checked++;
  if (/\.(woff2?|ttf|otf|eot)$/i.test(rel)) {
    checkFont(rel, readFileSync(abs));
    continue;
  }
  if (BINARY.test(rel) || size > MAX_TEXT_BYTES) continue;
  checkText(rel, readFileSync(abs, "utf8"));
}

if (problems.length) {
  console.error(`\n✖ Supply-chain guard: ${problems.length} problem(s) found — stopping.\n`);
  console.error(problems.join("\n"));
  console.error(
    "\nThis repo was hit by injected malware before (PolinRider, Sep 2026). Do NOT run or deploy this code" +
      "\nuntil you've checked these files. If it's a genuine false positive, fix the line or adjust" +
      "\nscripts/check-injection.mjs.\n"
  );
  process.exit(1);
}
console.log(`✔ Supply-chain guard: ${checked} files checked, no injected code found.`);
