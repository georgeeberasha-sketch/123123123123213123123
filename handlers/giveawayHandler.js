import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { createEmbed, successEmbed, errorEmbed } from "../utils/embedBuilder.js";
import { config } from "../config.js";
import ms from "ms";

export async function handleButton(interaction, client, args) {
  const [action, giveawayId] = args;

  switch (action) {
    case "enter":
      await enterGiveaway(interaction, client, giveawayId);
      break;
    case "reroll":
      await rerollGiveaway(interaction, client, giveawayId);
      break;
  }
}

export async function handleModal(interaction, client, args) {
  // Handle giveaway creation modal if needed
}

async function enterGiveaway(interaction, client, giveawayId) {
  const giveaway = client.data.giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.reply({
      embeds: [errorEmbed("This giveaway no longer exists.")],
      ephemeral: true,
    });
  }

  if (giveaway.ended) {
    return interaction.reply({
      embeds: [errorEmbed("This giveaway has already ended.")],
      ephemeral: true,
    });
  }

  // Check requirements
  if (giveaway.requiredRoleId) {
    const member = interaction.member;
    if (!member.roles.cache.has(giveaway.requiredRoleId)) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `You need the <@&${giveaway.requiredRoleId}> role to enter this giveaway.`
          ),
        ],
        ephemeral: true,
      });
    }
  }

  // Check if already entered
  if (giveaway.entries.includes(interaction.user.id)) {
    // Remove entry
    giveaway.entries = giveaway.entries.filter((id) => id !== interaction.user.id);
    client.data.giveaways.set(giveawayId, giveaway);

    await updateGiveawayMessage(interaction, client, giveaway);

    return interaction.reply({
      embeds: [successEmbed("You have left the giveaway.")],
      ephemeral: true,
    });
  }

  // Add entry
  giveaway.entries.push(interaction.user.id);
  client.data.giveaways.set(giveawayId, giveaway);

  await updateGiveawayMessage(interaction, client, giveaway);

  await interaction.reply({
    embeds: [
      successEmbed(
        `You have entered the giveaway! Good luck!\n\n**Total entries:** ${giveaway.entries.length}`
      ),
    ],
    ephemeral: true,
  });
}

async function updateGiveawayMessage(interaction, client, giveaway) {
  try {
    const channel = client.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(giveaway.messageId);
    if (!message) return;

    const embed = createGiveawayEmbed(giveaway);
    const buttons = createGiveawayButtons(giveaway);

    await message.edit({ embeds: [embed], components: [buttons] });
  } catch (error) {
    console.error("Error updating giveaway message:", error);
  }
}

export function createGiveawayEmbed(giveaway) {
  const timeLeft = giveaway.endsAt - Date.now();
  const endTime = Math.floor(giveaway.endsAt / 1000);

  let description = `**Prize:** ${giveaway.prize}\n\n`;
  description += `**Winners:** ${giveaway.winnerCount}\n`;
  description += `**Entries:** ${giveaway.entries.length}\n`;
  description += `**Hosted by:** <@${giveaway.hostId}>\n\n`;

  if (giveaway.requiredRoleId) {
    description += `**Required Role:** <@&${giveaway.requiredRoleId}>\n\n`;
  }

  if (giveaway.ended) {
    description += `**Status:** Ended\n`;
    if (giveaway.winners && giveaway.winners.length > 0) {
      description += `**Winners:** ${giveaway.winners.map((id) => `<@${id}>`).join(", ")}`;
    } else {
      description += `**Winners:** No valid entries`;
    }
  } else {
    description += `**Ends:** <t:${endTime}:R> (<t:${endTime}:F>)`;
  }

  return createEmbed({
    title: `${config.giveaways.emoji} GIVEAWAY ${config.giveaways.emoji}`,
    description,
    color: giveaway.ended ? config.colors.error : config.colors.success,
    footer: `Giveaway ID: ${giveaway.id}`,
  });
}

export function createGiveawayButtons(giveaway) {
  const row = new ActionRowBuilder();

  if (!giveaway.ended) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${giveaway.id}`)
        .setLabel(`Enter (${giveaway.entries.length})`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(config.giveaways.emoji)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_reroll_${giveaway.id}`)
        .setLabel("Reroll Winner")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔄")
    );
  }

  return row;
}

export async function startGiveaway(client, options) {
  const {
    channelId,
    prize,
    duration,
    winnerCount,
    hostId,
    requiredRoleId,
  } = options;

  const channel = client.channels.cache.get(channelId);
  if (!channel) throw new Error("Channel not found");

  const giveawayId = `gw_${Date.now()}`;
  const endsAt = Date.now() + ms(duration);

  const giveaway = {
    id: giveawayId,
    channelId,
    messageId: null,
    prize,
    winnerCount: winnerCount || 1,
    hostId,
    requiredRoleId: requiredRoleId || null,
    entries: [],
    winners: [],
    endsAt,
    ended: false,
    createdAt: Date.now(),
  };

  const embed = createGiveawayEmbed(giveaway);
  const buttons = createGiveawayButtons(giveaway);

  const message = await channel.send({
    content: config.giveaways.roleId
      ? `${config.giveaways.emoji} **GIVEAWAY** ${config.giveaways.emoji} <@&${config.giveaways.roleId}>`
      : `${config.giveaways.emoji} **GIVEAWAY** ${config.giveaways.emoji}`,
    embeds: [embed],
    components: [buttons],
  });

  giveaway.messageId = message.id;
  client.data.giveaways.set(giveawayId, giveaway);

  // Schedule end
  scheduleGiveawayEnd(client, giveaway);

  return giveaway;
}

export function scheduleGiveawayEnd(client, giveaway) {
  const timeLeft = giveaway.endsAt - Date.now();

  if (timeLeft <= 0) {
    endGiveaway(client, giveaway.id);
    return;
  }

  setTimeout(() => {
    endGiveaway(client, giveaway.id);
  }, timeLeft);
}

export async function endGiveaway(client, giveawayId) {
  const giveaway = client.data.giveaways.get(giveawayId);
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;

  // Select winners
  const winners = [];
  const entries = [...giveaway.entries];

  for (let i = 0; i < giveaway.winnerCount && entries.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * entries.length);
    winners.push(entries.splice(randomIndex, 1)[0]);
  }

  giveaway.winners = winners;
  client.data.giveaways.set(giveawayId, giveaway);

  // Update message
  try {
    const channel = client.channels.cache.get(giveaway.channelId);
    if (channel) {
      const message = await channel.messages.fetch(giveaway.messageId);
      if (message) {
        const embed = createGiveawayEmbed(giveaway);
        const buttons = createGiveawayButtons(giveaway);
        await message.edit({ embeds: [embed], components: [buttons] });

        // Announce winners
        if (winners.length > 0) {
          await channel.send({
            content: `${config.giveaways.emoji} **GIVEAWAY ENDED** ${config.giveaways.emoji}\n\nCongratulations ${winners.map((id) => `<@${id}>`).join(", ")}! You won **${giveaway.prize}**!`,
          });
        } else {
          await channel.send({
            content: `${config.giveaways.emoji} **GIVEAWAY ENDED** ${config.giveaways.emoji}\n\nNo valid entries. No winners selected.`,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error ending giveaway:", error);
  }
}

async function rerollGiveaway(interaction, client, giveawayId) {
  const giveaway = client.data.giveaways.get(giveawayId);

  if (!giveaway) {
    return interaction.reply({
      embeds: [errorEmbed("Giveaway not found.")],
      ephemeral: true,
    });
  }

  // Check permissions
  if (
    interaction.user.id !== giveaway.hostId &&
    !interaction.member.permissions.has("ManageGuild")
  ) {
    return interaction.reply({
      embeds: [errorEmbed("Only the host or a moderator can reroll the giveaway.")],
      ephemeral: true,
    });
  }

  if (!giveaway.ended) {
    return interaction.reply({
      embeds: [errorEmbed("The giveaway hasn't ended yet.")],
      ephemeral: true,
    });
  }

  const availableEntries = giveaway.entries.filter(
    (id) => !giveaway.winners.includes(id)
  );

  if (availableEntries.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed("No more eligible entries to reroll.")],
      ephemeral: true,
    });
  }

  const newWinner =
    availableEntries[Math.floor(Math.random() * availableEntries.length)];
  giveaway.winners.push(newWinner);
  client.data.giveaways.set(giveawayId, giveaway);

  await interaction.reply({
    content: `${config.giveaways.emoji} **REROLL** ${config.giveaways.emoji}\n\nThe new winner is <@${newWinner}>! Congratulations, you won **${giveaway.prize}**!`,
  });
}

// Initialize active giveaways on bot start
export async function initializeGiveaways(client) {
  for (const [id, giveaway] of client.data.giveaways) {
    if (!giveaway.ended) {
      scheduleGiveawayEnd(client, giveaway);
    }
  }
}
