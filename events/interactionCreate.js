import { errorEmbed } from "../utils/embedBuilder.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      // Check cooldowns
      const { cooldowns } = client;
      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Map());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime =
          timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return interaction.reply({
            embeds: [
              errorEmbed(
                `Please wait ${timeLeft.toFixed(1)} seconds before using \`/${command.data.name}\` again.`
              ),
            ],
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = {
          embeds: [
            errorEmbed(
              "There was an error executing this command. Please try again later."
            ),
          ],
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      const [action, ...args] = interaction.customId.split("_");

      try {
        switch (action) {
          case "ticket":
            const ticketHandler = await import(
              "../handlers/ticketHandler.js"
            );
            await ticketHandler.handleButton(interaction, client, args);
            break;
          case "giveaway":
            const giveawayHandler = await import(
              "../handlers/giveawayHandler.js"
            );
            await giveawayHandler.handleButton(interaction, client, args);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Button interaction error:", error);
      }
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
      const [action, ...args] = interaction.customId.split("_");

      try {
        switch (action) {
          case "ticket":
            const ticketHandler = await import(
              "../handlers/ticketHandler.js"
            );
            await ticketHandler.handleSelectMenu(interaction, client, args);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Select menu interaction error:", error);
      }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      const [action, ...args] = interaction.customId.split("_");

      try {
        switch (action) {
          case "ticket":
            const ticketHandler = await import(
              "../handlers/ticketHandler.js"
            );
            await ticketHandler.handleModal(interaction, client, args);
            break;
          case "giveaway":
            const giveawayHandler = await import(
              "../handlers/giveawayHandler.js"
            );
            await giveawayHandler.handleModal(interaction, client, args);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Modal interaction error:", error);
      }
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;

      try {
        await command.autocomplete(interaction, client);
      } catch (error) {
        console.error("Autocomplete error:", error);
      }
    }
  },
};
