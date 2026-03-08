import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { createEmbed, successEmbed, errorEmbed } from "../utils/embedBuilder.js";
import { config } from "../config.js";

export async function handleButton(interaction, client, args) {
  const [action, ...params] = args;

  switch (action) {
    case "create":
      await showCategorySelect(interaction);
      break;
    case "close":
      await closeTicket(interaction, client, params[0]);
      break;
    case "claim":
      await claimTicket(interaction, client, params[0]);
      break;
    case "delete":
      await deleteTicket(interaction, client, params[0]);
      break;
    case "transcript":
      await createTranscript(interaction, client, params[0]);
      break;
    case "reopen":
      await reopenTicket(interaction, client, params[0]);
      break;
  }
}

export async function handleSelectMenu(interaction, client, args) {
  const [action] = args;

  if (action === "category") {
    await showTicketModal(interaction, interaction.values[0]);
  }
}

export async function handleModal(interaction, client, args) {
  const [action, category] = args;

  if (action === "create") {
    await createTicket(interaction, client, category);
  }
}

async function showCategorySelect(interaction) {
  const options = config.tickets.categories.map((cat, index) => ({
    label: cat.name,
    value: index.toString(),
    description: cat.description,
    emoji: cat.emoji,
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("ticket_category")
    .setPlaceholder("Select a ticket category...")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Create a Ticket",
        description: "Please select a category for your ticket:",
        color: config.colors.primary,
      }),
    ],
    components: [row],
    ephemeral: true,
  });
}

async function showTicketModal(interaction, categoryIndex) {
  const category = config.tickets.categories[parseInt(categoryIndex)];

  const modal = new ModalBuilder()
    .setCustomId(`ticket_create_${categoryIndex}`)
    .setTitle(`${category.emoji} ${category.name}`);

  const subjectInput = new TextInputBuilder()
    .setCustomId("subject")
    .setLabel("Subject")
    .setPlaceholder("Brief description of your issue")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Description")
    .setPlaceholder("Please provide details about your issue...")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(subjectInput),
    new ActionRowBuilder().addComponents(descriptionInput)
  );

  await interaction.showModal(modal);
}

async function createTicket(interaction, client, categoryIndex) {
  const category = config.tickets.categories[parseInt(categoryIndex)];
  const subject = interaction.fields.getTextInputValue("subject");
  const description = interaction.fields.getTextInputValue("description");

  // Check max tickets per user
  const userTickets = Array.from(client.data.tickets.values()).filter(
    (t) => t.userId === interaction.user.id && t.status === "open"
  );

  if (userTickets.length >= config.tickets.maxTicketsPerUser) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          `You already have ${config.tickets.maxTicketsPerUser} open tickets. Please close some before creating new ones.`
        ),
      ],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Create ticket channel
    const ticketNumber = client.data.tickets.size + 1;
    const channelName = `ticket-${ticketNumber.toString().padStart(4, "0")}`;

    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.tickets.categoryId || null,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        ...(config.tickets.supportRoleId
          ? [
              {
                id: config.tickets.supportRoleId,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.ManageMessages,
                ],
              },
            ]
          : []),
      ],
    });

    // Create ticket data
    const ticketData = {
      id: ticketNumber,
      channelId: ticketChannel.id,
      userId: interaction.user.id,
      category: category.name,
      subject,
      description,
      status: "open",
      claimedBy: null,
      createdAt: Date.now(),
      closedAt: null,
      messages: [],
    };

    client.data.tickets.set(ticketChannel.id, ticketData);

    // Create ticket embed
    const ticketEmbed = createEmbed({
      title: `${category.emoji} Ticket #${ticketNumber.toString().padStart(4, "0")}`,
      description: `**Category:** ${category.name}\n**Subject:** ${subject}\n\n**Description:**\n${description}`,
      color: config.colors.primary,
      fields: [
        { name: "Created By", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Status", value: "🟢 Open", inline: true },
        { name: "Claimed By", value: "Unclaimed", inline: true },
      ],
      footer: `Ticket ID: ${ticketChannel.id}`,
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${ticketChannel.id}`)
        .setLabel("Claim")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("✋"),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketChannel.id}`)
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒"),
      new ButtonBuilder()
        .setCustomId(`ticket_transcript_${ticketChannel.id}`)
        .setLabel("Transcript")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📜")
    );

    await ticketChannel.send({
      content: `<@${interaction.user.id}> ${config.tickets.supportRoleId ? `<@&${config.tickets.supportRoleId}>` : ""}`,
      embeds: [ticketEmbed],
      components: [buttons],
    });

    // Log ticket creation
    if (config.tickets.logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(
        config.tickets.logChannelId
      );
      if (logChannel) {
        await logChannel.send({
          embeds: [
            createEmbed({
              title: "Ticket Created",
              description: `**Ticket:** ${ticketChannel}\n**User:** <@${interaction.user.id}>\n**Category:** ${category.name}\n**Subject:** ${subject}`,
              color: config.colors.success,
            }),
          ],
        });
      }
    }

    await interaction.editReply({
      embeds: [
        successEmbed(`Your ticket has been created: ${ticketChannel}`),
      ],
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to create ticket. Please try again later.")],
    });
  }
}

async function claimTicket(interaction, client, channelId) {
  const ticket = client.data.tickets.get(channelId);

  if (!ticket) {
    return interaction.reply({
      embeds: [errorEmbed("Ticket not found.")],
      ephemeral: true,
    });
  }

  if (ticket.claimedBy) {
    return interaction.reply({
      embeds: [errorEmbed(`This ticket is already claimed by <@${ticket.claimedBy}>.`)],
      ephemeral: true,
    });
  }

  ticket.claimedBy = interaction.user.id;
  client.data.tickets.set(channelId, ticket);

  await interaction.reply({
    embeds: [
      successEmbed(`This ticket has been claimed by <@${interaction.user.id}>.`),
    ],
  });
}

async function closeTicket(interaction, client, channelId) {
  const ticket = client.data.tickets.get(channelId);

  if (!ticket) {
    return interaction.reply({
      embeds: [errorEmbed("Ticket not found.")],
      ephemeral: true,
    });
  }

  ticket.status = "closed";
  ticket.closedAt = Date.now();
  client.data.tickets.set(channelId, ticket);

  // Update channel permissions
  const channel = interaction.guild.channels.cache.get(channelId);
  if (channel) {
    await channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false,
    });

    const closeEmbed = createEmbed({
      title: "Ticket Closed",
      description: `This ticket has been closed by <@${interaction.user.id}>.\n\nYou can reopen it or delete it using the buttons below.`,
      color: config.colors.warning,
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_reopen_${channelId}`)
        .setLabel("Reopen")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔓"),
      new ButtonBuilder()
        .setCustomId(`ticket_transcript_${channelId}`)
        .setLabel("Transcript")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📜"),
      new ButtonBuilder()
        .setCustomId(`ticket_delete_${channelId}`)
        .setLabel("Delete")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🗑️")
    );

    await interaction.reply({
      embeds: [closeEmbed],
      components: [buttons],
    });
  }
}

async function reopenTicket(interaction, client, channelId) {
  const ticket = client.data.tickets.get(channelId);

  if (!ticket) {
    return interaction.reply({
      embeds: [errorEmbed("Ticket not found.")],
      ephemeral: true,
    });
  }

  ticket.status = "open";
  ticket.closedAt = null;
  client.data.tickets.set(channelId, ticket);

  // Update channel permissions
  const channel = interaction.guild.channels.cache.get(channelId);
  if (channel) {
    await channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: true,
    });
  }

  await interaction.reply({
    embeds: [successEmbed(`Ticket reopened by <@${interaction.user.id}>.`)],
  });
}

async function deleteTicket(interaction, client, channelId) {
  const ticket = client.data.tickets.get(channelId);

  if (!ticket) {
    return interaction.reply({
      embeds: [errorEmbed("Ticket not found.")],
      ephemeral: true,
    });
  }

  await interaction.reply({
    embeds: [
      createEmbed({
        title: "Deleting Ticket",
        description: "This ticket will be deleted in 5 seconds...",
        color: config.colors.error,
      }),
    ],
  });

  // Log before deletion
  if (config.tickets.logChannelId) {
    const logChannel = interaction.guild.channels.cache.get(
      config.tickets.logChannelId
    );
    if (logChannel) {
      await logChannel.send({
        embeds: [
          createEmbed({
            title: "Ticket Deleted",
            description: `**Ticket #${ticket.id}**\n**User:** <@${ticket.userId}>\n**Deleted By:** <@${interaction.user.id}>`,
            color: config.colors.error,
          }),
        ],
      });
    }
  }

  setTimeout(async () => {
    const channel = interaction.guild.channels.cache.get(channelId);
    if (channel) {
      await channel.delete();
    }
    client.data.tickets.delete(channelId);
  }, 5000);
}

async function createTranscript(interaction, client, channelId) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.guild.channels.cache.get(channelId);
  if (!channel) {
    return interaction.editReply({
      embeds: [errorEmbed("Channel not found.")],
    });
  }

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map(
        (m) =>
          `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || "[Embed/Attachment]"}`
      )
      .join("\n");

    // Send transcript as file
    const buffer = Buffer.from(transcript, "utf-8");

    await interaction.editReply({
      content: "Here is the ticket transcript:",
      files: [
        {
          attachment: buffer,
          name: `transcript-${channel.name}.txt`,
        },
      ],
    });
  } catch (error) {
    console.error("Error creating transcript:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to create transcript.")],
    });
  }
}

export function createTicketPanel() {
  const embed = createEmbed({
    title: "🎫 Support Tickets",
    description:
      "Need help? Click the button below to create a support ticket.\n\n" +
      "**Available Categories:**\n" +
      config.tickets.categories.map((c) => `${c.emoji} **${c.name}** - ${c.description}`).join("\n"),
    color: config.colors.primary,
    footer: "CS2 Community Support",
  });

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_create")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫")
  );

  return { embeds: [embed], components: [button] };
}
