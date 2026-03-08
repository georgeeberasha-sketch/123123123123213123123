import {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
} from "discord.js";
import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { BOT_TOKEN, config, validateTokens } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Validate tokens before starting
if (!validateTokens()) {
  process.exit(1);
}

// Create client with all necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildBans,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();
client.config = config;

// Data storage (in-memory, persisted to JSON files)
client.data = {
  tickets: new Map(),
  giveaways: new Map(),
  warnings: new Map(),
  linkedSteam: new Map(),
  customCommands: new Map(),
};

// Load data from files
import { loadData, saveData } from "./utils/dataManager.js";
await loadData(client);

// Load all commands
const commandsPath = join(__dirname, "commands");
if (existsSync(commandsPath)) {
  const commandFolders = readdirSync(commandsPath);
  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter((file) => file.endsWith(".js"));
    
    for (const file of commandFiles) {
      try {
        const command = await import(`./commands/${folder}/${file}`);
        if (command.default?.data) {
          client.slashCommands.set(command.default.data.name, command.default);
        }
        if (command.default?.name) {
          client.commands.set(command.default.name, command.default);
        }
      } catch (error) {
        console.error(`Error loading command ${folder}/${file}:`, error.message);
      }
    }
  }
}

// Load all events
const eventsPath = join(__dirname, "events");
if (existsSync(eventsPath)) {
  const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
  
  for (const file of eventFiles) {
    try {
      const event = await import(`./events/${file}`);
      if (event.default?.once) {
        client.once(event.default.name, (...args) => event.default.execute(...args, client));
      } else if (event.default?.name) {
        client.on(event.default.name, (...args) => event.default.execute(...args, client));
      }
    } catch (error) {
      console.error(`Error loading event ${file}:`, error.message);
    }
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await saveData(client);
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down...");
  await saveData(client);
  client.destroy();
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// Login
console.log("Starting bot...");
client.login(BOT_TOKEN);
