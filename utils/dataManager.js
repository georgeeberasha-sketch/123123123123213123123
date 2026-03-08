import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dataFiles = {
  tickets: "tickets.json",
  giveaways: "giveaways.json",
  warnings: "warnings.json",
  linkedSteam: "linked-steam.json",
  customCommands: "custom-commands.json",
};

export async function loadData(client) {
  for (const [key, filename] of Object.entries(dataFiles)) {
    const filePath = join(dataDir, filename);
    try {
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, "utf8"));
        client.data[key] = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      client.data[key] = new Map();
    }
  }
  console.log("Data loaded successfully!");
}

export async function saveData(client) {
  for (const [key, filename] of Object.entries(dataFiles)) {
    const filePath = join(dataDir, filename);
    try {
      const data = Object.fromEntries(client.data[key]);
      writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
    }
  }
  console.log("Data saved successfully!");
}

// Auto-save every 5 minutes
export function startAutoSave(client) {
  setInterval(() => {
    saveData(client);
  }, 5 * 60 * 1000);
}
