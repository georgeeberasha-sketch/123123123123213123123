import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import {
  startGiveaway,
  endGiveaway,
  createGiveawayEmbed,
  createGiveawayButtons,
} from "../../handlers/giveawayHandler.js";
import { successEmbed, errorEmbed, createEmbed } from "../../utils/embedBuilder.js";
import { config } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Giveaway management commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Start a new giveaway")
        .addStringOption((option) =>
          option
            .setName("prize")
            .setDescription("What is the prize?")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("duration")
            .setDescription("How long? (e.g., 1h, 1d, 1w)")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("winners")
            .setDescription("Number of winners (default: 1)")
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to host the giveaway (default: current)")
        )
        .addRoleOption((option) =>
          option
            .setName("required_role")
            .setDescription("Role required to enter")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("End a giveaway early")
        .addStringOption((option) =>
          option
            .setName("giveaway_id")
            .setDescription("The giveaway ID")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all active giveaways")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a giveaway")
        .addStringOption((option) =>
          option
            .setName("giveaway_id")
            .setDescription("The giveaway ID")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "start":
        await handleStart(interaction, client);
        break;
      case "end":
        await handleEnd(interaction, client);
        break;
      case "list":
        await handleList(interaction, client);
        break;
      case "delete":
        await handleDelete(interaction, client);
        break;
    }
  },

  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused();
    const giveaways = Array.from(client.data.giveaways.values())
      .filter((g) => g.id.includes(focusedValue) || g.prize.toLowerCase().includes(focusedValue.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      giveaways.map((g) => ({
        name: `${g.prize} (${g.ended ? "Ended" : "Active"})`,
        value: g.id,
      }))
    );
  },
};

async function handleStart(interaction, client) {
  const prize = interaction.options.getString("prize");
  const duration = interaction.options.getString("duration");
  const winners = interaction.options.getInteger("winners") || 1;
  const channel = interaction.options.getChannel("channel") || interaction.channel;
  const requiredRole = interaction.options.getRole("required_role");

  await interaction.deferReply({ ephemeral: true });

  try {
    const giveaway = await startGiveaway(client, {
      channelId: channel.id,
      prize,
      duration,
      winnerCount: winners,
      hostId: interaction.user.id,
      requiredRoleId: requiredRole?.id,
    });

    await interaction.editReply({
      embeds: [
        successEmbed(
          `Giveaway started in ${channel}!\n\n**Prize:** ${prize}\n**Duration:** ${duration}\n**Winners:** ${winners}`
        ),
      ],
    });
  } catch (error) {
    console.error("Error starting giveaway:", error);
    await interaction.editReply({
      embeds: [errorEmbed(`Failed to start giveaway: ${error.message}`)],
    });
  }
}

async function handleEnd(interaction, client) {
  const giveawayId = interaction.options.getString("giveaway_id");
  const giveaway = client.data.giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.reply({
      embeds: [errorEmbed("Giveaway not found.")],
      ephemeral: true,
    });
  }

  if (giveaway.ended) {
    return interaction.reply({
      embeds: [errorEmbed("This giveaway has already ended.")],
      ephemeral: true,
    });
  }

  await endGiveaway(client, giveawayId);

  await interaction.reply({
    embeds: [successEmbed(`Giveaway for **${giveaway.prize}** has been ended.`)],
    ephemeral: true,
  });
}

async function handleList(interaction, client) {
  const giveaways = Array.from(client.data.giveaways.values()).filter(
    (g) => !g.ended
  );

  if (giveaways.length === 0) {
    return interaction.reply({
      embeds: [
        createEmbed({
          title: "Active Giveaways",
          description: "There are no active giveaways.",
          color: config.colors.warning,
        }),
      ],
      ephemeral: true,
    });
  }

  const fields = giveaways.map((g) => ({
    name: g.prize,
    value: `**Channel:** <#${g.channelId}>\n**Entries:** ${g.entries.length}\n**Ends:** <t:${Math.floor(g.endsAt / 1000)}:R>\n**ID:** \`${g.id}\``,
    inline: true,
  }));

  await interaction.reply({
    embeds: [
      createEmbed({
        title: `${config.giveaways.emoji} Active Giveaways (${giveaways.length})`,
        fields,
        color: config.colors.success,
      }),
    ],
    ephemeral: true,
  });
}

async function handleDelete(interaction, client) {
  const giveawayId = interaction.options.getString("giveaway_id");
  const giveaway = client.data.giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.reply({
      embeds: [errorEmbed("Giveaway not found.")],
      ephemeral: true,
    });
  }

  // Delete the message
  try {
    const channel = client.channels.cache.get(giveaway.channelId);
    if (channel) {
      const message = await channel.messages.fetch(giveaway.messageId);
      if (message) await message.delete();
    }
  } catch (error) {
    // Message might already be deleted
  }

  client.data.giveaways.delete(giveawayId);

  await interaction.reply({
    embeds: [successEmbed(`Giveaway for **${giveaway.prize}** has been deleted.`)],
    ephemeral: true,
  });
}
