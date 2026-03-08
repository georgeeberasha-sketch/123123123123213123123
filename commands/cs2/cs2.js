import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { createEmbed, successEmbed, errorEmbed, cs2Embed } from "../../utils/embedBuilder.js";
import { config } from "../../config.js";

// CS2 Ranks
const CS2_RANKS = [
  { name: "Silver I", elo: [0, 999], color: "#8C9196" },
  { name: "Silver II", elo: [1000, 1999], color: "#8C9196" },
  { name: "Silver III", elo: [2000, 2999], color: "#8C9196" },
  { name: "Silver IV", elo: [3000, 3999], color: "#8C9196" },
  { name: "Silver Elite", elo: [4000, 4999], color: "#8C9196" },
  { name: "Silver Elite Master", elo: [5000, 5999], color: "#8C9196" },
  { name: "Gold Nova I", elo: [6000, 6999], color: "#D4AF37" },
  { name: "Gold Nova II", elo: [7000, 7999], color: "#D4AF37" },
  { name: "Gold Nova III", elo: [8000, 8999], color: "#D4AF37" },
  { name: "Gold Nova Master", elo: [9000, 9999], color: "#D4AF37" },
  { name: "Master Guardian I", elo: [10000, 10999], color: "#4A90D9" },
  { name: "Master Guardian II", elo: [11000, 11999], color: "#4A90D9" },
  { name: "Master Guardian Elite", elo: [12000, 12999], color: "#4A90D9" },
  { name: "Distinguished Master Guardian", elo: [13000, 13999], color: "#4A90D9" },
  { name: "Legendary Eagle", elo: [14000, 14999], color: "#8847FF" },
  { name: "Legendary Eagle Master", elo: [15000, 15999], color: "#8847FF" },
  { name: "Supreme Master First Class", elo: [16000, 17999], color: "#EB4B4B" },
  { name: "Global Elite", elo: [18000, 99999], color: "#FFD700" },
];

// CS2 Maps
const CS2_MAPS = [
  "Dust 2",
  "Mirage",
  "Inferno",
  "Nuke",
  "Overpass",
  "Ancient",
  "Anubis",
  "Vertigo",
];

// CS2 Weapons for random selection
const CS2_WEAPONS = {
  pistols: ["USP-S", "P2000", "Glock-18", "Dual Berettas", "P250", "Five-SeveN", "CZ75-Auto", "Desert Eagle", "R8 Revolver"],
  smgs: ["MAC-10", "MP9", "MP7", "UMP-45", "P90", "PP-Bizon", "MP5-SD"],
  rifles: ["AK-47", "M4A4", "M4A1-S", "Galil AR", "FAMAS", "SG 553", "AUG"],
  snipers: ["AWP", "SSG 08", "G3SG1", "SCAR-20"],
  heavy: ["Nova", "XM1014", "MAG-7", "Sawed-Off", "M249", "Negev"],
};

export default {
  data: new SlashCommandBuilder()
    .setName("cs2")
    .setDescription("CS2 related commands")
    .addSubcommand((sub) =>
      sub
        .setName("link")
        .setDescription("Link your Steam account")
        .addStringOption((opt) =>
          opt
            .setName("steam_id")
            .setDescription("Your Steam ID (e.g., 76561198xxxxxxxxx)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("unlink").setDescription("Unlink your Steam account")
    )
    .addSubcommand((sub) =>
      sub
        .setName("profile")
        .setDescription("View a linked Steam profile")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to check (default: yourself)")
        )
    )
    .addSubcommand((sub) =>
      sub.setName("map").setDescription("Get a random CS2 map")
    )
    .addSubcommand((sub) =>
      sub.setName("weapon").setDescription("Get a random weapon loadout")
    )
    .addSubcommand((sub) =>
      sub
        .setName("team")
        .setDescription("Randomly assign players to teams")
        .addStringOption((opt) =>
          opt
            .setName("players")
            .setDescription("Mention players or comma-separated names")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("crosshair")
        .setDescription("Generate a random crosshair code")
    )
    .addSubcommand((sub) =>
      sub.setName("ranks").setDescription("Show CS2 rank distribution")
    )
    .addSubcommand((sub) =>
      sub
        .setName("coinflip")
        .setDescription("Flip for CT or T side")
    )
    .addSubcommand((sub) =>
      sub
        .setName("veto")
        .setDescription("Start a map veto between two players/teams")
        .addUserOption((opt) =>
          opt.setName("opponent").setDescription("Your opponent").setRequired(true)
        )
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "link":
        await handleLink(interaction, client);
        break;
      case "unlink":
        await handleUnlink(interaction, client);
        break;
      case "profile":
        await handleProfile(interaction, client);
        break;
      case "map":
        await handleMap(interaction);
        break;
      case "weapon":
        await handleWeapon(interaction);
        break;
      case "team":
        await handleTeam(interaction);
        break;
      case "crosshair":
        await handleCrosshair(interaction);
        break;
      case "ranks":
        await handleRanks(interaction);
        break;
      case "coinflip":
        await handleCoinflip(interaction);
        break;
      case "veto":
        await handleVeto(interaction);
        break;
    }
  },
};

async function handleLink(interaction, client) {
  const steamId = interaction.options.getString("steam_id");

  // Basic Steam ID validation
  if (!/^\d{17}$/.test(steamId)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Invalid Steam ID format. Please provide a 17-digit Steam ID (e.g., 76561198xxxxxxxxx).\n\nYou can find your Steam ID at: https://steamid.io"
        ),
      ],
      ephemeral: true,
    });
  }

  client.data.linkedSteam.set(interaction.user.id, {
    steamId,
    linkedAt: Date.now(),
  });

  // Give linked role if configured
  if (config.cs2.linkedRoleId) {
    try {
      await interaction.member.roles.add(config.cs2.linkedRoleId);
    } catch (error) {
      console.error("Error adding linked role:", error);
    }
  }

  await interaction.reply({
    embeds: [
      successEmbed(
        `Your Steam account has been linked!\n\n**Steam ID:** \`${steamId}\`\n**Profile:** https://steamcommunity.com/profiles/${steamId}`
      ),
    ],
    ephemeral: true,
  });
}

async function handleUnlink(interaction, client) {
  if (!client.data.linkedSteam.has(interaction.user.id)) {
    return interaction.reply({
      embeds: [errorEmbed("You don't have a linked Steam account.")],
      ephemeral: true,
    });
  }

  client.data.linkedSteam.delete(interaction.user.id);

  // Remove linked role if configured
  if (config.cs2.linkedRoleId) {
    try {
      await interaction.member.roles.remove(config.cs2.linkedRoleId);
    } catch (error) {
      console.error("Error removing linked role:", error);
    }
  }

  await interaction.reply({
    embeds: [successEmbed("Your Steam account has been unlinked.")],
    ephemeral: true,
  });
}

async function handleProfile(interaction, client) {
  const user = interaction.options.getUser("user") || interaction.user;
  const steamData = client.data.linkedSteam.get(user.id);

  if (!steamData) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          user.id === interaction.user.id
            ? "You haven't linked your Steam account. Use `/cs2 link` to link it."
            : "This user hasn't linked their Steam account."
        ),
      ],
      ephemeral: true,
    });
  }

  const embed = cs2Embed(
    `**Steam ID:** \`${steamData.steamId}\`\n\n` +
      `**Profile Link:** [Click here](https://steamcommunity.com/profiles/${steamData.steamId})\n` +
      `**Linked:** <t:${Math.floor(steamData.linkedAt / 1000)}:R>`,
    `${user.username}'s CS2 Profile`
  );

  embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));

  await interaction.reply({ embeds: [embed] });
}

async function handleMap(interaction) {
  const randomMap = CS2_MAPS[Math.floor(Math.random() * CS2_MAPS.length)];

  await interaction.reply({
    embeds: [
      cs2Embed(
        `The random map is:\n\n# ${randomMap}`,
        "Random Map Selection"
      ),
    ],
  });
}

async function handleWeapon(interaction) {
  const pistol = CS2_WEAPONS.pistols[Math.floor(Math.random() * CS2_WEAPONS.pistols.length)];
  const primary = Math.random() > 0.3
    ? (Math.random() > 0.5
        ? CS2_WEAPONS.rifles[Math.floor(Math.random() * CS2_WEAPONS.rifles.length)]
        : CS2_WEAPONS.snipers[Math.floor(Math.random() * CS2_WEAPONS.snipers.length)])
    : (Math.random() > 0.5
        ? CS2_WEAPONS.smgs[Math.floor(Math.random() * CS2_WEAPONS.smgs.length)]
        : CS2_WEAPONS.heavy[Math.floor(Math.random() * CS2_WEAPONS.heavy.length)]);

  await interaction.reply({
    embeds: [
      cs2Embed(
        `**Primary:** ${primary}\n**Secondary:** ${pistol}`,
        "Random Loadout"
      ),
    ],
  });
}

async function handleTeam(interaction) {
  const input = interaction.options.getString("players");
  
  // Extract mentions or split by comma
  const mentions = interaction.options.resolved?.users;
  let players = [];

  if (mentions && mentions.size > 0) {
    players = Array.from(mentions.values()).map((u) => u.username);
  } else {
    players = input.split(",").map((p) => p.trim()).filter((p) => p);
  }

  if (players.length < 2) {
    return interaction.reply({
      embeds: [errorEmbed("You need at least 2 players to create teams.")],
      ephemeral: true,
    });
  }

  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const mid = Math.ceil(shuffled.length / 2);
  const team1 = shuffled.slice(0, mid);
  const team2 = shuffled.slice(mid);

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Team Assignment",
        fields: [
          {
            name: "Team 1 (CT)",
            value: team1.join("\n") || "None",
            inline: true,
          },
          {
            name: "Team 2 (T)",
            value: team2.join("\n") || "None",
            inline: true,
          },
        ],
        color: config.colors.cs2,
      }),
    ],
  });
}

async function handleCrosshair(interaction) {
  // Generate random crosshair settings
  const style = Math.floor(Math.random() * 5);
  const size = (Math.random() * 4 + 1).toFixed(1);
  const gap = (Math.random() * 4 - 2).toFixed(1);
  const thickness = (Math.random() * 2 + 0.5).toFixed(1);
  const outline = Math.random() > 0.5 ? 1 : 0;
  const dot = Math.random() > 0.7 ? 1 : 0;
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  const code = `CSGO-${generateRandomCode()}-${generateRandomCode()}-${generateRandomCode()}-${generateRandomCode()}-${generateRandomCode()}`;

  const settings = [
    `cl_crosshairstyle ${style}`,
    `cl_crosshairsize ${size}`,
    `cl_crosshairgap ${gap}`,
    `cl_crosshairthickness ${thickness}`,
    `cl_crosshair_outline ${outline}`,
    `cl_crosshairdot ${dot}`,
    `cl_crosshaircolor_r ${r}`,
    `cl_crosshaircolor_g ${g}`,
    `cl_crosshaircolor_b ${b}`,
  ].join("\n");

  await interaction.reply({
    embeds: [
      cs2Embed(
        `**Random Crosshair Generated:**\n\n\`\`\`\n${settings}\n\`\`\`\n\n*Copy and paste these commands into your CS2 console!*`,
        "Random Crosshair"
      ),
    ],
  });
}

function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function handleRanks(interaction) {
  const rankList = CS2_RANKS.map(
    (r, i) => `${i + 1}. **${r.name}** (${r.elo[0].toLocaleString()} - ${r.elo[1].toLocaleString()} Rating)`
  ).join("\n");

  await interaction.reply({
    embeds: [
      cs2Embed(
        `**CS2 Competitive Ranks:**\n\n${rankList}`,
        "CS2 Rank Distribution"
      ),
    ],
  });
}

async function handleCoinflip(interaction) {
  const result = Math.random() > 0.5 ? "CT (Counter-Terrorist)" : "T (Terrorist)";
  const emoji = result.startsWith("CT") ? "🔵" : "🟠";

  await interaction.reply({
    embeds: [
      cs2Embed(
        `${emoji} **${result}**\n\nYou will play as ${result} side!`,
        "Side Selection"
      ),
    ],
  });
}

async function handleVeto(interaction) {
  const opponent = interaction.options.getUser("opponent");

  if (opponent.id === interaction.user.id) {
    return interaction.reply({
      embeds: [errorEmbed("You can't veto against yourself!")],
      ephemeral: true,
    });
  }

  // Start with random picker
  const firstPicker = Math.random() > 0.5 ? interaction.user : opponent;

  const embed = createEmbed({
    title: "Map Veto",
    description:
      `**${interaction.user.username}** vs **${opponent.username}**\n\n` +
      `**First Ban:** ${firstPicker.username}\n\n` +
      `**Available Maps:**\n${CS2_MAPS.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\n` +
      `*Use chat to type the map number you want to ban. Alternate until 1 map remains.*`,
    color: config.colors.cs2,
    footer: "Map Veto System",
  });

  await interaction.reply({ embeds: [embed] });
}
