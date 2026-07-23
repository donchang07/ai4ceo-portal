import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(__dirname, "results.json");

function sanitizeString(value) {
  return value
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/([?&]token=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/([?&](?:token_hash|access_token|refresh_token)=)[^&\s]+/gi, "$1[REDACTED]");
}

function sanitize(value) {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sanitize(nested)]));
  }
  return value;
}

const parsed = JSON.parse(fs.readFileSync(resultsPath, "utf8").replace(/^\uFEFF/, ""));
fs.writeFileSync(resultsPath, `${JSON.stringify(sanitize(parsed), null, 2)}\n`, "utf8");
console.log("[sanitize-results] Playwright 결과의 token/ANSI 마스킹 완료");
