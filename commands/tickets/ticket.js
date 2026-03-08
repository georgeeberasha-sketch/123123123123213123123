import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { createTicketPanel } from "../../handlers/ticketHandler.js";
import { successEmbed, errorEmbed } from "../../utils/embedBuilder.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Create a ticket panel in this channel")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a user to this ticket")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a user from this ticket")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rename")
        .setDescription("Rename this ticket")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The new name for the ticket")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "panel":
        await interaction.channel.send(createTicketPanel());
        await interaction.reply({
          embeds: [successEmbed("Ticket panel created!")],
          ephemeral: true,
        });
        break;

      case "add":
        const userToAdd = interaction.options.getUser("user");
        const ticket = client.data.tickets.get(interaction.channel.id);

        if (!ticket) {
          return interaction.reply({
            embeds: [errorEmbed("This command can only be used in a ticket channel.")],
            ephemeral: true,
          });
        }

        await interaction.channel.permissionOverwrites.edit(userToAdd.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        await interaction.reply({
          embeds: [successEmbed(`${userToAdd} has been added to the ticket.`)],
        });
        break;

      case "remove":
        const userToRemove = interaction.options.getUser("user");
        const ticketData = client.data.tickets.get(interaction.channel.id);

        if (!ticketData) {
          return interaction.reply({
            embeds: [errorEmbed("This command can only be used in a ticket channel.")],
            ephemeral: true,
          });
        }

        if (userToRemove.id === ticketData.userId) {
          return interaction.reply({
            embeds: [errorEmbed("You cannot remove the ticket creator.")],
            ephemeral: true,
          });
        }

        await interaction.channel.permissionOverwrites.delete(userToRemove.id);

        await interaction.reply({
          embeds: [successEmbed(`${userToRemove} has been removed from the ticket.`)],
        });
        break;

      case "rename":
        const ticketInfo = client.data.tickets.get(interaction.channel.id);

        if (!ticketInfo) {
          return interaction.reply({
            embeds: [errorEmbed("This command can only be used in a ticket channel.")],
            ephemeral: true,
          });
        }

        const newName = interaction.options.getString("name");
        await interaction.channel.setName(newName);

        await interaction.reply({
          embeds: [successEmbed(`Ticket renamed to \`${newName}\`.`)],
        });
        break;
    }
  },
};
