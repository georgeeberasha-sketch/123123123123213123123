import { ActivityType } from "discord.js";
import { startAutoSave } from "../utils/dataManager.js";

export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎮 CS2 Community Bot is now online!`);
    console.log(`📛 Logged in as: ${client.user.tag}`);
    console.log(`🌐 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`👥 Total members: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);
    console.log(`⚡ Commands loaded: ${client.slashCommands.size} slash, ${client.commands.size} prefix`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Set rotating status
    const statuses = [
      { name: "CS2 Matches", type: ActivityType.Watching },
      { name: "/help for commands", type: ActivityType.Playing },
      { name: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} players`, type: ActivityType.Watching },
      { name: "Counter-Strike 2", type: ActivityType.Playing },
    ];

    let statusIndex = 0;
    setInterval(() => {
      client.user.setActivity(statuses[statusIndex].name, {
        type: statuses[statusIndex].type,
      });
      statusIndex = (statusIndex + 1) % statuses.length;
    }, 30000);

    // Set initial status
    client.user.setActivity(statuses[0].name, { type: statuses[0].type });

    // Start auto-save
    startAutoSave(client);
  },
};
