import { SlashCommandBuilder, EmbedBuilder, version as djsVersion } from "discord.js";
import { createEmbed, cs2Embed } from "../../utils/embedBuilder.js";
import { config } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("utility")
    .setDescription("Utility commands")
    .addSubcommand((sub) =>
      sub.setName("ping").setDescription("Check bot latency")
    )
    .addSubcommand((sub) =>
      sub.setName("serverinfo").setDescription("Get server information")
    )
    .addSubcommand((sub) =>
      sub
        .setName("userinfo")
        .setDescription("Get user information")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to check")
        )
    )
    .addSubcommand((sub) =>
      sub.setName("avatar").setDescription("Get a user's avatar")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to get avatar")
        )
    )
    .addSubcommand((sub) =>
      sub.setName("membercount").setDescription("Show member count")
    )
    .addSubcommand((sub) =>
      sub.setName("invite").setDescription("Get bot invite link")
    )
    .addSubcommand((sub) =>
      sub.setName("botinfo").setDescription("Get bot information")
    )
    .addSubcommand((sub) =>
      sub.setName("help").setDescription("Show all commands")
    )
    .addSubcommand((sub) =>
      sub
        .setName("poll")
        .setDescription("Create a poll")
        .addStringOption((opt) =>
          opt.setName("question").setDescription("Poll question").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("options").setDescription("Options separated by | (max 10)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remind")
        .setDescription("Set a reminder")
        .addStringOption((opt) =>
          opt.setName("time").setDescription("When to remind (e.g., 1h, 30m)").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Reminder message").setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "ping":
        await handlePing(interaction, client);
        break;
      case "serverinfo":
        await handleServerInfo(interaction);
        break;
      case "userinfo":
        await handleUserInfo(interaction);
        break;
      case "avatar":
        await handleAvatar(interaction);
        break;
      case "membercount":
        await handleMemberCount(interaction);
        break;
      case "invite":
        await handleInvite(interaction, client);
        break;
      case "botinfo":
        await handleBotInfo(interaction, client);
        break;
      case "help":
        await handleHelp(interaction, client);
        break;
      case "poll":
        await handlePoll(interaction);
        break;
      case "remind":
        await handleRemind(interaction);
        break;
    }
  },
};

async function handlePing(interaction, client) {
  const sent = await interaction.reply({
    content: "Pinging...",
    fetchReply: true,
  });

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsLatency = client.ws.ping;

  await interaction.editReply({
    content: null,
    embeds: [
      createEmbed({
        title: "Pong!",
        fields: [
          { name: "Roundtrip", value: `${roundtrip}ms`, inline: true },
          { name: "WebSocket", value: `${wsLatency}ms`, inline: true },
        ],
        color: roundtrip < 200 ? config.colors.success : config.colors.warning,
      }),
    ],
  });
}

async function handleServerInfo(interaction) {
  const guild = interaction.guild;
  const owner = await guild.fetchOwner();

  const embed = createEmbed({
    title: guild.name,
    thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
    fields: [
      { name: "Owner", value: owner.user.tag, inline: true },
      { name: "Members", value: guild.memberCount.toString(), inline: true },
      { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
      { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
      { name: "Emojis", value: guild.emojis.cache.size.toString(), inline: true },
      { name: "Boosts", value: guild.premiumSubscriptionCount.toString(), inline: true },
      {
        name: "Created",
        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
      { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
      {
        name: "Verification",
        value: guild.verificationLevel.toString(),
        inline: true,
      },
    ],
    footer: `Server ID: ${guild.id}`,
    color: config.colors.primary,
  });

  await interaction.reply({ embeds: [embed] });
}

async function handleUserInfo(interaction) {
  const user = interaction.options.getUser("user") || interaction.user;
  const member = interaction.guild.members.cache.get(user.id);

  const embed = createEmbed({
    title: user.tag,
    thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
    fields: [
      { name: "ID", value: user.id, inline: true },
      { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
      {
        name: "Account Created",
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    ],
    color: member?.displayColor || config.colors.primary,
  });

  if (member) {
    embed.addFields([
      {
        name: "Joined Server",
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        inline: true,
      },
      { name: "Nickname", value: member.nickname || "None", inline: true },
      {
        name: "Highest Role",
        value: member.roles.highest.toString(),
        inline: true,
      },
      {
        name: `Roles (${member.roles.cache.size - 1})`,
        value:
          member.roles.cache
            .filter((r) => r.id !== interaction.guild.id)
            .map((r) => r.toString())
            .join(", ")
            .slice(0, 1024) || "None",
      },
    ]);
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleAvatar(interaction) {
  const user = interaction.options.getUser("user") || interaction.user;

  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Avatar`)
    .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .setColor(config.colors.primary);

  await interaction.reply({ embeds: [embed] });
}

async function handleMemberCount(interaction) {
  const guild = interaction.guild;
  const members = guild.members.cache;
  const humans = members.filter((m) => !m.user.bot).size;
  const bots = members.filter((m) => m.user.bot).size;
  const online = members.filter(
    (m) => m.presence?.status === "online" || m.presence?.status === "idle" || m.presence?.status === "dnd"
  ).size;

  await interaction.reply({
    embeds: [
      createEmbed({
        title: `${guild.name} Members`,
        fields: [
          { name: "Total", value: guild.memberCount.toString(), inline: true },
          { name: "Humans", value: humans.toString(), inline: true },
          { name: "Bots", value: bots.toString(), inline: true },
          { name: "Online", value: online.toString(), inline: true },
        ],
        color: config.colors.primary,
      }),
    ],
  });
}

async function handleInvite(interaction, client) {
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Invite Me!",
        description: `[Click here to invite the bot](${inviteUrl})`,
        color: config.colors.primary,
      }),
    ],
  });
}

async function handleBotInfo(interaction, client) {
  const uptime = formatUptime(client.uptime);

  await interaction.reply({
    embeds: [
      createEmbed({
        title: client.user.username,
        thumbnail: client.user.displayAvatarURL({ dynamic: true }),
        fields: [
          { name: "Servers", value: client.guilds.cache.size.toString(), inline: true },
          {
            name: "Users",
            value: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toString(),
            inline: true,
          },
          { name: "Uptime", value: uptime, inline: true },
          { name: "Commands", value: client.slashCommands.size.toString(), inline: true },
          { name: "Discord.js", value: `v${djsVersion}`, inline: true },
          { name: "Node.js", value: process.version, inline: true },
        ],
        color: config.colors.cs2,
        footer: "CS2 Community Bot",
      }),
    ],
  });
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}

async function handleHelp(interaction, client) {
  const commands = Array.from(client.slashCommands.values());

  const categories = {
    admin: [],
    moderation: [],
    tickets: [],
    giveaway: [],
    cs2: [],
    utility: [],
  };

  // Group commands by category (based on command name)
  commands.forEach((cmd) => {
    const name = cmd.data.name;
    if (categories[name]) {
      categories[name].push(cmd);
    } else {
      categories.utility.push(cmd);
    }
  });

  const embed = cs2Embed(
    `Here are all available commands:\n\n` +
      Object.entries(categories)
        .filter(([, cmds]) => cmds.length > 0)
        .map(
          ([cat, cmds]) =>
            `**${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n` +
            cmds.map((c) => `\`/${c.data.name}\` - ${c.data.description}`).join("\n")
        )
        .join("\n\n") +
      `\n\n**Prefix Commands:** Use \`${config.prefix}help\` for prefix commands`,
    "Help Menu"
  );

  await interaction.reply({ embeds: [embed] });
}

async function handlePoll(interaction) {
  const question = interaction.options.getString("question");
  const optionsStr = interaction.options.getString("options");

  let options = optionsStr
    ? optionsStr.split("|").map((o) => o.trim()).filter((o) => o).slice(0, 10)
    : ["Yes", "No"];

  const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  const description = options.map((opt, i) => `${emojis[i]} ${opt}`).join("\n");

  const embed = createEmbed({
    title: `📊 ${question}`,
    description,
    color: config.colors.primary,
    footer: `Poll by ${interaction.user.tag}`,
  });

  const message = await interaction.reply({ embeds: [embed], fetchReply: true });

  for (let i = 0; i < options.length; i++) {
    await message.react(emojis[i]);
  }
}

async function handleRemind(interaction) {
  const timeStr = interaction.options.getString("time");
  const message = interaction.options.getString("message");

  // Parse time
  const match = timeStr.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    return interaction.reply({
      embeds: [
        createEmbed({
          title: "Invalid Time",
          description: "Please use format like: 30s, 5m, 1h, 1d",
          color: config.colors.error,
        }),
      ],
      ephemeral: true,
    });
  }

  const [, amount, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const ms = parseInt(amount) * multipliers[unit];

  if (ms > 7 * 86400000) {
    return interaction.reply({
      embeds: [
        createEmbed({
          title: "Invalid Time",
          description: "Reminders cannot be set for more than 7 days.",
          color: config.colors.error,
        }),
      ],
      ephemeral: true,
    });
  }

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Reminder Set",
        description: `I'll remind you <t:${Math.floor((Date.now() + ms) / 1000)}:R>\n\n**Message:** ${message}`,
        color: config.colors.success,
      }),
    ],
    ephemeral: true,
  });

  setTimeout(async () => {
    try {
      await interaction.user.send({
        embeds: [
          createEmbed({
            title: "Reminder",
            description: message,
            color: config.colors.primary,
            footer: `Reminder from ${interaction.guild.name}`,
          }),
        ],
      });
    } catch {
      // Try to send in channel if DMs are disabled
      try {
        await interaction.channel.send({
          content: `<@${interaction.user.id}>`,
          embeds: [
            createEmbed({
              title: "Reminder",
              description: message,
              color: config.colors.primary,
            }),
          ],
        });
      } catch {
        // Channel might be deleted
      }
    }
  }, ms);
}
