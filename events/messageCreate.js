import { errorEmbed } from "../utils/embedBuilder.js";
import { config } from "../config.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    // Ignore bots
    if (message.author.bot) return;

    // Check for custom commands
    const customCmd = client.data.customCommands.get(message.content.toLowerCase());
    if (customCmd) {
      return message.channel.send(customCmd.response);
    }

    // Check for prefix commands
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) return;

    // Check permissions
    if (command.permissions) {
      const memberPerms = message.member.permissions;
      if (!memberPerms.has(command.permissions)) {
        return message.reply({
          embeds: [errorEmbed("You don't have permission to use this command.")],
        });
      }
    }

    // Check if command is admin only
    if (command.adminOnly && !message.member.permissions.has("Administrator")) {
      return message.reply({
        embeds: [errorEmbed("This command is for administrators only.")],
      });
    }

    // Execute command
    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`Error executing ${commandName}:`, error);
      message.reply({
        embeds: [errorEmbed("There was an error executing this command.")],
      });
    }
  },
};
