// ============================================
// CS2 COMMUNITY BOT - SINGLE FILE VERSION
// ============================================
// შეცვალე ეს მონაცემები:
const BOT_TOKEN = "MTQ4MDE2MDY4OTc0NTI5NzQ0OA.G7f6Z7.2PqDudg8lVh5Vzcg7hX24-y9iGJ6sebnn12JCk";
const CLIENT_ID = "1480160689745297448";
const GUILD_ID = "YOUR_GUILD_ID_HERE"; // სერვერის ID
const PREFIX = "$";
// ============================================

import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { writeFileSync, readFileSync, existsSync } from "fs";

// ============================================
// CLIENT SETUP
// ============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// ============================================
// DATA STORAGE
// ============================================
const dataFile = "./data.json";
let data = {
  tickets: {},
  giveaways: {},
  warnings: {},
  customCommands: {},
  steamLinks: {},
  ticketCount: 0,
};

function loadData() {
  try {
    if (existsSync(dataFile)) {
      data = JSON.parse(readFileSync(dataFile, "utf8"));
    }
  } catch (e) {
    console.log("Creating new data file...");
  }
}

function saveData() {
  writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

loadData();

// ============================================
// EMBED HELPERS
// ============================================
const COLORS = {
  primary: 0xff6b00,
  success: 0x00ff00,
  error: 0xff0000,
  cs2: 0xde9b35,
};

function embed(title, description, color = COLORS.primary) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

function success(msg) {
  return embed("Success", msg, COLORS.success);
}

function error(msg) {
  return embed("Error", msg, COLORS.error);
}

// ============================================
// SLASH COMMANDS DEFINITIONS
// ============================================
const commands = [
  // UTILITY
  new SlashCommandBuilder().setName("ping").setDescription("Check bot latency"),
  new SlashCommandBuilder().setName("help").setDescription("Show all commands"),
  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Server information"),
  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("User information")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Target user")
    ),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show avatar")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Target user")
    ),

  // MODERATION
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to kick").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to ban").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("duration").setDescription("Duration (1m, 1h, 1d)").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View warnings")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete messages")
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Amount (1-100)").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  // ADMIN
  new SlashCommandBuilder()
    .setName("dm")
    .setDescription("DM a user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Make announcement")
    .addChannelOption((opt) =>
      opt.setName("channel").setDescription("Channel").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("addcmd")
    .setDescription("Add custom command")
    .addStringOption((opt) =>
      opt.setName("name").setDescription("Command name").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("response").setDescription("Response").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("delcmd")
    .setDescription("Delete custom command")
    .addStringOption((opt) =>
      opt.setName("name").setDescription("Command name").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("listcmd")
    .setDescription("List custom commands"),

  // TICKETS
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket commands")
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Setup ticket system")
    )
    .addSubcommand((sub) =>
      sub.setName("close").setDescription("Close ticket")
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add user to ticket")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User").setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  // GIVEAWAY
  new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Giveaway commands")
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start giveaway")
        .addStringOption((opt) =>
          opt.setName("prize").setDescription("Prize").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("duration").setDescription("Duration (1m, 1h, 1d)").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("winners").setDescription("Number of winners").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End giveaway")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("Message ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("Reroll winner")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("Message ID").setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  // CS2
  new SlashCommandBuilder()
    .setName("cs2")
    .setDescription("CS2 commands")
    .addSubcommand((sub) =>
      sub
        .setName("link")
        .setDescription("Link Steam account")
        .addStringOption((opt) =>
          opt.setName("steam_id").setDescription("Steam ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("unlink").setDescription("Unlink Steam")
    )
    .addSubcommand((sub) =>
      sub.setName("map").setDescription("Random CS2 map")
    )
    .addSubcommand((sub) =>
      sub.setName("weapon").setDescription("Random weapon")
    )
    .addSubcommand((sub) =>
      sub.setName("crosshair").setDescription("Generate crosshair")
    )
    .addSubcommand((sub) =>
      sub.setName("ranks").setDescription("CS2 ranks info")
    ),

  // FUN
  new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create poll")
    .addStringOption((opt) =>
      opt.setName("question").setDescription("Question").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("options").setDescription("Options (comma separated)").setRequired(true)
    ),
];

// ============================================
// DEPLOY COMMANDS
// ============================================
async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    console.log("Deploying commands...");
    if (GUILD_ID && GUILD_ID !== "YOUR_GUILD_ID_HERE") {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands.map((c) => c.toJSON()),
      });
      console.log("Commands deployed to guild!");
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands.map((c) => c.toJSON()),
      });
      console.log("Commands deployed globally!");
    }
  } catch (e) {
    console.error("Deploy error:", e);
  }
}

// ============================================
// PARSE DURATION
// ============================================
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return num * multipliers[unit];
}

// ============================================
// CS2 DATA
// ============================================
const CS2_MAPS = [
  "Dust 2", "Mirage", "Inferno", "Nuke", "Overpass", 
  "Ancient", "Anubis", "Vertigo", "Train", "Cache"
];

const CS2_WEAPONS = {
  Rifles: ["AK-47", "M4A4", "M4A1-S", "AUG", "SG 553", "FAMAS", "Galil AR"],
  SMGs: ["MP9", "MAC-10", "MP7", "MP5-SD", "UMP-45", "P90", "PP-Bizon"],
  Pistols: ["Glock-18", "USP-S", "P2000", "P250", "Five-SeveN", "Tec-9", "Desert Eagle"],
  Snipers: ["AWP", "SSG 08", "G3SG1", "SCAR-20"],
  Heavy: ["Nova", "XM1014", "MAG-7", "Sawed-Off", "M249", "Negev"],
};

const CS2_RANKS = [
  "Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master",
  "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master",
  "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian",
  "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite"
];

// ============================================
// INTERACTION HANDLER
// ============================================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await handleCommand(interaction);
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction);
  }
});

async function handleCommand(i) {
  const cmd = i.commandName;
  const sub = i.options.getSubcommand(false);

  try {
    // UTILITY
    if (cmd === "ping") {
      return i.reply({
        embeds: [embed("Pong!", `Latency: ${client.ws.ping}ms`)],
      });
    }

    if (cmd === "help") {
      const helpEmbed = embed("Commands", "All available commands:")
        .addFields(
          { name: "Utility", value: "`/ping` `/help` `/serverinfo` `/userinfo` `/avatar` `/poll`", inline: false },
          { name: "Moderation", value: "`/kick` `/ban` `/timeout` `/warn` `/warnings` `/purge` `/lock` `/unlock`", inline: false },
          { name: "Admin", value: "`/dm` `/announce` `/addcmd` `/delcmd` `/listcmd`", inline: false },
          { name: "Tickets", value: "`/ticket setup` `/ticket close` `/ticket add`", inline: false },
          { name: "Giveaway", value: "`/giveaway start` `/giveaway end` `/giveaway reroll`", inline: false },
          { name: "CS2", value: "`/cs2 link` `/cs2 unlink` `/cs2 map` `/cs2 weapon` `/cs2 crosshair` `/cs2 ranks`", inline: false },
          { name: "Custom Commands", value: `Use prefix \`${PREFIX}\` for custom commands`, inline: false }
        );
      return i.reply({ embeds: [helpEmbed] });
    }

    if (cmd === "serverinfo") {
      const g = i.guild;
      return i.reply({
        embeds: [
          embed("Server Info", "")
            .setThumbnail(g.iconURL())
            .addFields(
              { name: "Name", value: g.name, inline: true },
              { name: "Owner", value: `<@${g.ownerId}>`, inline: true },
              { name: "Members", value: `${g.memberCount}`, inline: true },
              { name: "Created", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true }
            ),
        ],
      });
    }

    if (cmd === "userinfo") {
      const user = i.options.getUser("user") || i.user;
      const member = await i.guild.members.fetch(user.id).catch(() => null);
      return i.reply({
        embeds: [
          embed("User Info", "")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
              { name: "Username", value: user.tag, inline: true },
              { name: "ID", value: user.id, inline: true },
              { name: "Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
              { name: "Joined", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "N/A", inline: true }
            ),
        ],
      });
    }

    if (cmd === "avatar") {
      const user = i.options.getUser("user") || i.user;
      return i.reply({
        embeds: [
          embed(`${user.username}'s Avatar`, "").setImage(
            user.displayAvatarURL({ size: 512 })
          ),
        ],
      });
    }

    // MODERATION
    if (cmd === "kick") {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason") || "No reason";
      const member = await i.guild.members.fetch(user.id);
      await member.kick(reason);
      return i.reply({ embeds: [success(`Kicked ${user.tag} for: ${reason}`)] });
    }

    if (cmd === "ban") {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason") || "No reason";
      await i.guild.members.ban(user, { reason });
      return i.reply({ embeds: [success(`Banned ${user.tag} for: ${reason}`)] });
    }

    if (cmd === "timeout") {
      const user = i.options.getUser("user");
      const duration = parseDuration(i.options.getString("duration"));
      const reason = i.options.getString("reason") || "No reason";
      if (!duration) return i.reply({ embeds: [error("Invalid duration. Use: 1m, 1h, 1d")], ephemeral: true });
      const member = await i.guild.members.fetch(user.id);
      await member.timeout(duration, reason);
      return i.reply({ embeds: [success(`Timed out ${user.tag} for: ${reason}`)] });
    }

    if (cmd === "warn") {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason");
      if (!data.warnings[user.id]) data.warnings[user.id] = [];
      data.warnings[user.id].push({ reason, date: Date.now(), by: i.user.id });
      saveData();
      return i.reply({ embeds: [success(`Warned ${user.tag} for: ${reason}`)] });
    }

    if (cmd === "warnings") {
      const user = i.options.getUser("user");
      const warns = data.warnings[user.id] || [];
      if (!warns.length) return i.reply({ embeds: [embed("Warnings", `${user.tag} has no warnings`)] });
      const list = warns.map((w, i) => `${i + 1}. ${w.reason} - <t:${Math.floor(w.date / 1000)}:R>`).join("\n");
      return i.reply({ embeds: [embed(`Warnings for ${user.tag}`, list)] });
    }

    if (cmd === "purge") {
      const amount = i.options.getInteger("amount");
      if (amount < 1 || amount > 100) return i.reply({ embeds: [error("Amount must be 1-100")], ephemeral: true });
      const deleted = await i.channel.bulkDelete(amount, true);
      return i.reply({ embeds: [success(`Deleted ${deleted.size} messages`)], ephemeral: true });
    }

    if (cmd === "lock") {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false });
      return i.reply({ embeds: [success("Channel locked")] });
    }

    if (cmd === "unlock") {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: true });
      return i.reply({ embeds: [success("Channel unlocked")] });
    }

    // ADMIN
    if (cmd === "dm") {
      const user = i.options.getUser("user");
      const message = i.options.getString("message");
      await user.send({ embeds: [embed("Message from Staff", message)] });
      return i.reply({ embeds: [success(`DM sent to ${user.tag}`)], ephemeral: true });
    }

    if (cmd === "announce") {
      const channel = i.options.getChannel("channel");
      const message = i.options.getString("message");
      await channel.send({ embeds: [embed("Announcement", message)] });
      return i.reply({ embeds: [success(`Announcement sent to ${channel}`)], ephemeral: true });
    }

    if (cmd === "addcmd") {
      const name = i.options.getString("name").toLowerCase();
      const response = i.options.getString("response");
      data.customCommands[name] = response;
      saveData();
      return i.reply({ embeds: [success(`Command \`${PREFIX}${name}\` created`)] });
    }

    if (cmd === "delcmd") {
      const name = i.options.getString("name").toLowerCase();
      if (!data.customCommands[name]) return i.reply({ embeds: [error("Command not found")], ephemeral: true });
      delete data.customCommands[name];
      saveData();
      return i.reply({ embeds: [success(`Command \`${PREFIX}${name}\` deleted`)] });
    }

    if (cmd === "listcmd") {
      const cmds = Object.keys(data.customCommands);
      if (!cmds.length) return i.reply({ embeds: [embed("Custom Commands", "No custom commands")] });
      return i.reply({ embeds: [embed("Custom Commands", cmds.map((c) => `\`${PREFIX}${c}\``).join(", "))] });
    }

    // TICKETS
    if (cmd === "ticket") {
      if (sub === "setup") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_create")
            .setLabel("Create Ticket")
            .setEmoji("📩")
            .setStyle(ButtonStyle.Primary)
        );
        await i.channel.send({
          embeds: [embed("Support Tickets", "Click the button below to create a support ticket.")],
          components: [row],
        });
        return i.reply({ embeds: [success("Ticket system setup!")], ephemeral: true });
      }

      if (sub === "close") {
        if (!i.channel.name.startsWith("ticket-")) {
          return i.reply({ embeds: [error("This is not a ticket channel")], ephemeral: true });
        }
        await i.reply({ embeds: [embed("Ticket", "Closing ticket in 5 seconds...")] });
        setTimeout(() => i.channel.delete().catch(() => {}), 5000);
        return;
      }

      if (sub === "add") {
        const user = i.options.getUser("user");
        await i.channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });
        return i.reply({ embeds: [success(`Added ${user} to ticket`)] });
      }
    }

    // GIVEAWAY
    if (cmd === "giveaway") {
      if (sub === "start") {
        const prize = i.options.getString("prize");
        const duration = parseDuration(i.options.getString("duration"));
        const winners = i.options.getInteger("winners");
        
        if (!duration) return i.reply({ embeds: [error("Invalid duration")], ephemeral: true });
        
        const endTime = Date.now() + duration;
        const giveawayEmbed = embed("Giveaway!", "")
          .setColor(COLORS.cs2)
          .addFields(
            { name: "Prize", value: prize, inline: true },
            { name: "Winners", value: `${winners}`, inline: true },
            { name: "Ends", value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
            { name: "Hosted by", value: `${i.user}`, inline: true }
          )
          .setFooter({ text: "Click the button to enter!" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("giveaway_enter")
            .setLabel("Enter (0)")
            .setEmoji("🎉")
            .setStyle(ButtonStyle.Success)
        );

        await i.reply({ embeds: [success("Giveaway started!")], ephemeral: true });
        const msg = await i.channel.send({ embeds: [giveawayEmbed], components: [row] });
        
        data.giveaways[msg.id] = {
          prize,
          winners,
          endTime,
          channelId: i.channel.id,
          entries: [],
          ended: false,
        };
        saveData();

        setTimeout(() => endGiveaway(msg.id), duration);
        return;
      }

      if (sub === "end") {
        const msgId = i.options.getString("message_id");
        await endGiveaway(msgId);
        return i.reply({ embeds: [success("Giveaway ended!")], ephemeral: true });
      }

      if (sub === "reroll") {
        const msgId = i.options.getString("message_id");
        const giveaway = data.giveaways[msgId];
        if (!giveaway || !giveaway.ended) {
          return i.reply({ embeds: [error("Giveaway not found or not ended")], ephemeral: true });
        }
        const winner = giveaway.entries[Math.floor(Math.random() * giveaway.entries.length)];
        return i.reply({ embeds: [embed("Reroll", `New winner: <@${winner}>`)] });
      }
    }

    // CS2
    if (cmd === "cs2") {
      if (sub === "link") {
        const steamId = i.options.getString("steam_id");
        data.steamLinks[i.user.id] = steamId;
        saveData();
        return i.reply({ embeds: [success(`Steam linked: ${steamId}`)] });
      }

      if (sub === "unlink") {
        delete data.steamLinks[i.user.id];
        saveData();
        return i.reply({ embeds: [success("Steam unlinked")] });
      }

      if (sub === "map") {
        const map = CS2_MAPS[Math.floor(Math.random() * CS2_MAPS.length)];
        return i.reply({ embeds: [embed("Random Map", `**${map}**`, COLORS.cs2)] });
      }

      if (sub === "weapon") {
        const categories = Object.keys(CS2_WEAPONS);
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const weapon = CS2_WEAPONS[cat][Math.floor(Math.random() * CS2_WEAPONS[cat].length)];
        return i.reply({
          embeds: [
            embed("Random Weapon", "", COLORS.cs2).addFields(
              { name: "Category", value: cat, inline: true },
              { name: "Weapon", value: weapon, inline: true }
            ),
          ],
        });
      }

      if (sub === "crosshair") {
        const size = Math.floor(Math.random() * 5) + 1;
        const gap = Math.floor(Math.random() * 5) - 2;
        const thickness = (Math.random() * 1.5 + 0.5).toFixed(1);
        const color = Math.floor(Math.random() * 5);
        const code = `CSGO-${Math.random().toString(36).substring(2, 7)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
        
        return i.reply({
          embeds: [
            embed("Random Crosshair", "", COLORS.cs2).addFields(
              { name: "Size", value: `${size}`, inline: true },
              { name: "Gap", value: `${gap}`, inline: true },
              { name: "Thickness", value: thickness, inline: true },
              { name: "Color", value: `${color}`, inline: true },
              { name: "Share Code", value: `\`${code}\``, inline: false }
            ),
          ],
        });
      }

      if (sub === "ranks") {
        return i.reply({
          embeds: [
            embed("CS2 Ranks", CS2_RANKS.map((r, i) => `${i + 1}. ${r}`).join("\n"), COLORS.cs2),
          ],
        });
      }
    }

    // POLL
    if (cmd === "poll") {
      const question = i.options.getString("question");
      const options = i.options.getString("options").split(",").map((o) => o.trim()).slice(0, 10);
      const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
      
      const pollEmbed = embed("Poll", question).addFields(
        options.map((opt, i) => ({ name: `${emojis[i]} Option ${i + 1}`, value: opt, inline: false }))
      );

      const msg = await i.reply({ embeds: [pollEmbed], fetchReply: true });
      for (let j = 0; j < options.length; j++) {
        await msg.react(emojis[j]);
      }
    }
  } catch (err) {
    console.error(err);
    i.reply({ embeds: [error(`Error: ${err.message}`)], ephemeral: true }).catch(() => {});
  }
}

// ============================================
// BUTTON HANDLER
// ============================================
async function handleButton(i) {
  if (i.customId === "ticket_create") {
    data.ticketCount++;
    const channel = await i.guild.channels.create({
      name: `ticket-${data.ticketCount}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: i.guild.roles.everyone, deny: ["ViewChannel"] },
        { id: i.user.id, allow: ["ViewChannel", "SendMessages"] },
      ],
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${i.user}`,
      embeds: [embed("Ticket Created", "Support will be with you shortly.\nClick the button below to close this ticket.")],
      components: [row],
    });

    data.tickets[channel.id] = { owner: i.user.id, created: Date.now() };
    saveData();

    return i.reply({ embeds: [success(`Ticket created: ${channel}`)], ephemeral: true });
  }

  if (i.customId === "ticket_close") {
    await i.reply({ embeds: [embed("Closing", "This ticket will be closed in 5 seconds...")] });
    setTimeout(() => i.channel.delete().catch(() => {}), 5000);
    return;
  }

  if (i.customId === "giveaway_enter") {
    const giveaway = data.giveaways[i.message.id];
    if (!giveaway || giveaway.ended) {
      return i.reply({ embeds: [error("This giveaway has ended")], ephemeral: true });
    }

    if (giveaway.entries.includes(i.user.id)) {
      return i.reply({ embeds: [error("You already entered!")], ephemeral: true });
    }

    giveaway.entries.push(i.user.id);
    saveData();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("giveaway_enter")
        .setLabel(`Enter (${giveaway.entries.length})`)
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Success)
    );

    await i.message.edit({ components: [row] });
    return i.reply({ embeds: [success("You entered the giveaway!")], ephemeral: true });
  }
}

// ============================================
// SELECT MENU HANDLER
// ============================================
async function handleSelectMenu(i) {
  // Add custom select menu handling if needed
}

// ============================================
// END GIVEAWAY
// ============================================
async function endGiveaway(messageId) {
  const giveaway = data.giveaways[messageId];
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;
  saveData();

  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(messageId);

    if (giveaway.entries.length === 0) {
      const endedEmbed = embed("Giveaway Ended", "No winners - no one entered!", COLORS.error);
      await message.edit({ embeds: [endedEmbed], components: [] });
      return;
    }

    const winners = [];
    const entries = [...giveaway.entries];
    for (let i = 0; i < Math.min(giveaway.winners, entries.length); i++) {
      const idx = Math.floor(Math.random() * entries.length);
      winners.push(entries.splice(idx, 1)[0]);
    }

    const winnerMentions = winners.map((w) => `<@${w}>`).join(", ");
    const endedEmbed = embed("Giveaway Ended!", "", COLORS.success)
      .addFields(
        { name: "Prize", value: giveaway.prize, inline: true },
        { name: "Winners", value: winnerMentions, inline: false }
      );

    await message.edit({ embeds: [endedEmbed], components: [] });
    await channel.send(`Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
  } catch (err) {
    console.error("Giveaway end error:", err);
  }
}

// ============================================
// MESSAGE HANDLER (PREFIX COMMANDS)
// ============================================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  // Custom commands
  if (data.customCommands[cmdName]) {
    return message.reply(data.customCommands[cmdName]);
  }
});

// ============================================
// WELCOME EVENT
// ============================================
client.on("guildMemberAdd", async (member) => {
  // You can customize this - set a welcome channel ID
  // const welcomeChannel = member.guild.channels.cache.get("CHANNEL_ID");
  // if (welcomeChannel) {
  //   welcomeChannel.send({ embeds: [embed("Welcome!", `Welcome ${member} to the server!`)] });
  // }
});

// ============================================
// READY EVENT
// ============================================
client.once("ready", async () => {
  console.log(`Bot online: ${client.user.tag}`);
  console.log(`Servers: ${client.guilds.cache.size}`);
  
  await deployCommands();
  
  client.user.setActivity("CS2 Community", { type: 3 });

  // Check for ended giveaways
  for (const [msgId, giveaway] of Object.entries(data.giveaways)) {
    if (!giveaway.ended && giveaway.endTime <= Date.now()) {
      endGiveaway(msgId);
    } else if (!giveaway.ended) {
      const remaining = giveaway.endTime - Date.now();
      setTimeout(() => endGiveaway(msgId), remaining);
    }
  }
});

// ============================================
// START BOT
// ============================================
if (BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
  console.log("ERROR: Bot token not set!");
  console.log("Open bot.js and set your BOT_TOKEN, CLIENT_ID, and GUILD_ID");
  process.exit(1);
}

client.login(BOT_TOKEN);
