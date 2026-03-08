import { REST, Routes } from "discord.js";
import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { BOT_TOKEN, CLIENT_ID, GUILD_ID, validateTokens } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Validate tokens
if (!validateTokens()) {
  process.exit(1);
}

const commands = [];

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
          commands.push(command.default.data.toJSON());
          console.log(`  Loaded: /${command.default.data.name}`);
        }
      } catch (error) {
        console.error(`  Error loading ${folder}/${file}:`, error.message);
      }
    }
  }
}

console.log(`\nTotal commands: ${commands.length}\n`);

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

async function deployCommands() {
  try {
    console.log("Deploying commands...\n");

    let data;

    if (GUILD_ID && GUILD_ID !== "YOUR_GUILD_ID_HERE") {
      // Guild commands (instant update, good for development)
      data = await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log(`Successfully registered ${data.length} guild commands.`);
      console.log(`Guild ID: ${GUILD_ID}`);
    } else {
      // Global commands (can take up to 1 hour to update)
      data = await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log(`Successfully registered ${data.length} global commands.`);
      console.log("Note: Global commands may take up to 1 hour to appear.");
    }

    console.log("\nRegistered commands:");
    commands.forEach((cmd) => {
      console.log(`  /${cmd.name} - ${cmd.description}`);
    });
    
    console.log("\nDone!");
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
}

deployCommands();
