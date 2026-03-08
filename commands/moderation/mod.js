import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, createEmbed } from "../../utils/embedBuilder.js";
import { config } from "../../config.js";
import ms from "ms";

export default {
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderation commands")
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("Kick a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to kick").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for kick")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("Ban a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to ban").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for ban")
        )
        .addIntegerOption((opt) =>
          opt
            .setName("delete_days")
            .setDescription("Days of messages to delete (0-7)")
            .setMinValue(0)
            .setMaxValue(7)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("unban")
        .setDescription("Unban a user")
        .addStringOption((opt) =>
          opt.setName("user_id").setDescription("User ID to unban").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("timeout")
        .setDescription("Timeout a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to timeout").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("duration")
            .setDescription("Duration (e.g., 1h, 1d)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for timeout")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("untimeout")
        .setDescription("Remove timeout from a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to untimeout").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("warn")
        .setDescription("Warn a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to warn").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for warning").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("warnings")
        .setDescription("View warnings for a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to check").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("clearwarnings")
        .setDescription("Clear all warnings for a member")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to clear warnings").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("purge")
        .setDescription("Delete multiple messages")
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Number of messages to delete (1-100)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Only delete messages from this user")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("slowmode")
        .setDescription("Set channel slowmode")
        .addStringOption((opt) =>
          opt
            .setName("duration")
            .setDescription("Slowmode duration (e.g., 5s, 1m, 0 to disable)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("lock")
        .setDescription("Lock the current channel")
    )
    .addSubcommand((sub) =>
      sub
        .setName("unlock")
        .setDescription("Unlock the current channel")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "kick":
        await handleKick(interaction, client);
        break;
      case "ban":
        await handleBan(interaction, client);
        break;
      case "unban":
        await handleUnban(interaction, client);
        break;
      case "timeout":
        await handleTimeout(interaction, client);
        break;
      case "untimeout":
        await handleUntimeout(interaction, client);
        break;
      case "warn":
        await handleWarn(interaction, client);
        break;
      case "warnings":
        await handleWarnings(interaction, client);
        break;
      case "clearwarnings":
        await handleClearWarnings(interaction, client);
        break;
      case "purge":
        await handlePurge(interaction, client);
        break;
      case "slowmode":
        await handleSlowmode(interaction, client);
        break;
      case "lock":
        await handleLock(interaction, client);
        break;
      case "unlock":
        await handleUnlock(interaction, client);
        break;
    }
  },
};

async function handleKick(interaction, client) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason provided";
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [errorEmbed("User not found in this server.")],
      ephemeral: true,
    });
  }

  if (!member.kickable) {
    return interaction.reply({
      embeds: [errorEmbed("I cannot kick this user.")],
      ephemeral: true,
    });
  }

  await member.kick(reason);
  await logModAction(interaction, client, "Kick", user, reason);

  await interaction.reply({
    embeds: [successEmbed(`${user.tag} has been kicked.\n**Reason:** ${reason}`)],
  });
}

async function handleBan(interaction, client) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason provided";
  const deleteDays = interaction.options.getInteger("delete_days") || 0;

  try {
    await interaction.guild.members.ban(user.id, {
      reason,
      deleteMessageDays: deleteDays,
    });

    await logModAction(interaction, client, "Ban", user, reason);

    await interaction.reply({
      embeds: [successEmbed(`${user.tag} has been banned.\n**Reason:** ${reason}`)],
    });
  } catch (error) {
    await interaction.reply({
      embeds: [errorEmbed("Failed to ban this user.")],
      ephemeral: true,
    });
  }
}

async function handleUnban(interaction, client) {
  const userId = interaction.options.getString("user_id");

  try {
    const ban = await interaction.guild.bans.fetch(userId);
    await interaction.guild.members.unban(userId);

    await interaction.reply({
      embeds: [successEmbed(`${ban.user.tag} has been unbanned.`)],
    });
  } catch (error) {
    await interaction.reply({
      embeds: [errorEmbed("User not found in ban list or invalid ID.")],
      ephemeral: true,
    });
  }
}

async function handleTimeout(interaction, client) {
  const user = interaction.options.getUser("user");
  const duration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason") || "No reason provided";
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [errorEmbed("User not found in this server.")],
      ephemeral: true,
    });
  }

  const durationMs = ms(duration);
  if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
    return interaction.reply({
      embeds: [errorEmbed("Invalid duration. Maximum is 28 days.")],
      ephemeral: true,
    });
  }

  await member.timeout(durationMs, reason);
  await logModAction(interaction, client, "Timeout", user, `${reason} (${duration})`);

  await interaction.reply({
    embeds: [
      successEmbed(`${user.tag} has been timed out for ${duration}.\n**Reason:** ${reason}`),
    ],
  });
}

async function handleUntimeout(interaction, client) {
  const user = interaction.options.getUser("user");
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [errorEmbed("User not found in this server.")],
      ephemeral: true,
    });
  }

  await member.timeout(null);

  await interaction.reply({
    embeds: [successEmbed(`Timeout removed from ${user.tag}.`)],
  });
}

async function handleWarn(interaction, client) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");

  const warnings = client.data.warnings.get(user.id) || [];
  warnings.push({
    reason,
    moderator: interaction.user.id,
    timestamp: Date.now(),
  });
  client.data.warnings.set(user.id, warnings);

  await logModAction(interaction, client, "Warning", user, reason);

  await interaction.reply({
    embeds: [
      successEmbed(
        `${user.tag} has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warnings.length}`
      ),
    ],
  });

  // Try to DM the user
  try {
    await user.send({
      embeds: [
        createEmbed({
          title: "You have been warned",
          description: `You received a warning in **${interaction.guild.name}**.\n\n**Reason:** ${reason}`,
          color: config.colors.warning,
        }),
      ],
    });
  } catch {
    // User has DMs disabled
  }
}

async function handleWarnings(interaction, client) {
  const user = interaction.options.getUser("user");
  const warnings = client.data.warnings.get(user.id) || [];

  if (warnings.length === 0) {
    return interaction.reply({
      embeds: [
        createEmbed({
          title: `Warnings for ${user.tag}`,
          description: "This user has no warnings.",
          color: config.colors.success,
        }),
      ],
    });
  }

  const warningList = warnings
    .map(
      (w, i) =>
        `**${i + 1}.** ${w.reason}\n   *By <@${w.moderator}> - <t:${Math.floor(w.timestamp / 1000)}:R>*`
    )
    .join("\n\n");

  await interaction.reply({
    embeds: [
      createEmbed({
        title: `Warnings for ${user.tag}`,
        description: warningList,
        color: config.colors.warning,
        footer: `Total: ${warnings.length} warning(s)`,
      }),
    ],
  });
}

async function handleClearWarnings(interaction, client) {
  const user = interaction.options.getUser("user");
  client.data.warnings.delete(user.id);

  await interaction.reply({
    embeds: [successEmbed(`All warnings cleared for ${user.tag}.`)],
  });
}

async function handlePurge(interaction, client) {
  const amount = interaction.options.getInteger("amount");
  const user = interaction.options.getUser("user");

  await interaction.deferReply({ ephemeral: true });

  try {
    let messages = await interaction.channel.messages.fetch({ limit: 100 });

    if (user) {
      messages = messages.filter((m) => m.author.id === user.id);
    }

    messages = messages.first(amount);
    const deleted = await interaction.channel.bulkDelete(messages, true);

    await interaction.editReply({
      embeds: [successEmbed(`Deleted ${deleted.size} messages.`)],
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [errorEmbed("Failed to delete messages. They might be too old.")],
    });
  }
}

async function handleSlowmode(interaction, client) {
  const duration = interaction.options.getString("duration");
  const seconds = duration === "0" ? 0 : Math.floor(ms(duration) / 1000);

  if (seconds < 0 || seconds > 21600) {
    return interaction.reply({
      embeds: [errorEmbed("Slowmode must be between 0 seconds and 6 hours.")],
      ephemeral: true,
    });
  }

  await interaction.channel.setRateLimitPerUser(seconds);

  await interaction.reply({
    embeds: [
      successEmbed(
        seconds === 0
          ? "Slowmode has been disabled."
          : `Slowmode set to ${duration}.`
      ),
    ],
  });
}

async function handleLock(interaction, client) {
  await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
    SendMessages: false,
  });

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Channel Locked",
        description: "This channel has been locked by a moderator.",
        color: config.colors.error,
      }),
    ],
  });
}

async function handleUnlock(interaction, client) {
  await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
    SendMessages: null,
  });

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Channel Unlocked",
        description: "This channel has been unlocked.",
        color: config.colors.success,
      }),
    ],
  });
}

async function logModAction(interaction, client, action, user, reason) {
  if (!config.logging.enabled || !config.logging.channelId) return;

  const logChannel = interaction.guild.channels.cache.get(config.logging.channelId);
  if (!logChannel) return;

  await logChannel.send({
    embeds: [
      createEmbed({
        title: `Moderation: ${action}`,
        fields: [
          { name: "User", value: `${user.tag} (${user.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
        ],
        color:
          action === "Warning" ? config.colors.warning : config.colors.error,
      }),
    ],
  });
}
