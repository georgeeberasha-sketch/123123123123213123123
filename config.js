// ============================================
// BOT CONFIGURATION - EDIT YOUR TOKENS HERE
// ============================================

export const BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"; // <-- შენი ბოტის ტოკენი ჩასვი აქ
export const CLIENT_ID = "YOUR_CLIENT_ID_HERE"; // <-- შენი Client ID ჩასვი აქ  
export const GUILD_ID = "YOUR_GUILD_ID_HERE";   // <-- შენი სერვერის ID ჩასვი აქ (ან დატოვე ცარიელი გლობალური ბრძანებებისთვის)

// ============================================

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load JSON config
export const config = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf-8"));

// Validate tokens
export function validateTokens() {
  const errors = [];
  
  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    errors.push("BOT_TOKEN არ არის მითითებული");
  }
  
  if (!CLIENT_ID || CLIENT_ID === "YOUR_CLIENT_ID_HERE") {
    errors.push("CLIENT_ID არ არის მითითებული");
  }
  
  if (errors.length > 0) {
    console.error("\n❌ კონფიგურაციის შეცდომა:");
    errors.forEach(e => console.error(`   - ${e}`));
    console.log("\n📝 გახსენი config.js და ჩასვი შენი ტოკენები\n");
    return false;
  }
  
  return true;
}
