import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { successEmbed, errorEmbed, createEmbed } from "../../utils/embedBuilder.js";
import { config } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Admin commands")
    .addSubcommand((sub) =>
      sub
        .setName("dm")
        .setDescription("DM a user")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to DM").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Message to send").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("announce")
        .setDescription("Send an announcement")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to announce in")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Announcement message").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Embed title")
        )
        .addRoleOption((opt) =>
          opt.setName("ping").setDescription("Role to ping")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("embed")
        .setDescription("Send a custom embed")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Channel to send in").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Embed title").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("description").setDescription("Embed description").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("color").setDescription("Hex color (e.g., #FF6B00)")
        )
        .addStringOption((opt) =>
          opt.setName("image").setDescription("Image URL")
        )
        .addStringOption((opt) =>
          opt.setName("thumbnail").setDescription("Thumbnail URL")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("say")
        .setDescription("Make the bot say something")
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Message").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Channel (default: current)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("addcommand")
        .setDescription("Add a custom text command")
        .addStringOption((opt) =>
          opt.setName("trigger").setDescription("Command trigger").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("response").setDescription("Command response").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("removecommand")
        .setDescription("Remove a custom command")
        .addStringOption((opt) =>
          opt
            .setName("trigger")
            .setDescription("Command trigger")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("listcommands").setDescription("List all custom commands")
    )
    .addSubcommand((sub) =>
      sub
        .setName("role")
        .setDescription("Give or remove a role from a user")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Target user").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("Role to give/remove").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("nickname")
        .setDescription("Change a user's nickname")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("Target user").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("nickname").setDescription("New nickname (leave empty to reset)")
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case "dm":
        await handleDM(interaction, client);
        break;
      case "announce":
        await handleAnnounce(interaction, client);
        break;
      case "embed":
        await handleEmbed(interaction, client);
        break;
      case "say":
        await handleSay(interaction, client);
        break;
      case "addcommand":
        await handleAddCommand(interaction, client);
        break;
      case "removecommand":
        await handleRemoveCommand(interaction, client);
        break;
      case "listcommands":
        await handleListCommands(interaction, client);
        break;
      case "role":
        await handleRole(interaction, client);
        break;
      case "nickname":
        await handleNickname(interaction, client);
        break;
    }
  },

  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused();
    const commands = Array.from(client.data.customCommands.keys());

    const filtered = commands
      .filter((c) => c.includes(focusedValue.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      filtered.map((c) => ({ name: c, value: c }))
    );
  },
};

async function handleDM(interaction, client) {
  const user = interaction.options.getUser("user");
  const message = interaction.options.getString("message");

  try {
    await user.send({
      embeds: [
        createEmbed({
          title: `Message from ${interaction.guild.name}`,
          description: message,
          color: config.colors.primary,
          footer: `Sent by ${interaction.user.tag}`,
        }),
      ],
    });

    await interaction.reply({
      embeds: [successEmbed(`DM sent to ${user.tag}.`)],
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      embeds: [errorEmbed("Could not DM this user. They may have DMs disabled.")],
      ephemeral: true,
    });
  }
}

async function handleAnnounce(interaction, client) {
  const channel = interaction.options.getChannel("channel");
  const message = interaction.options.getString("message");
  const title = interaction.options.getString("title") || "Announcement";
  const pingRole = interaction.options.getRole("ping");

  const embed = createEmbed({
    title,
    description: message,
    color: config.colors.primary,
    footer: `Announced by ${interaction.user.tag}`,
  });

  await channel.send({
    content: pingRole ? `<@&${pingRole.id}>` : undefined,
    embeds: [embed],
  });

  await interaction.reply({
    embeds: [successEmbed(`Announcement sent to ${channel}.`)],
    ephemeral: true,
  });
}

async function handleEmbed(interaction, client) {
  const channel = interaction.options.getChannel("channel");
  const title = interaction.options.getString("title");
  const description = interaction.options.getString("description");
  const color = interaction.options.getString("color") || config.colors.primary;
  const image = interaction.options.getString("image");
  const thumbnail = interaction.options.getString("thumbnail");

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);

  await channel.send({ embeds: [embed] });

  await interaction.reply({
    embeds: [successEmbed(`Embed sent to ${channel}.`)],
    ephemeral: true,
  });
}

async function handleSay(interaction, client) {
  const message = interaction.options.getString("message");
  const channel = interaction.options.getChannel("channel") || interaction.channel;

  await channel.send(message);

  await interaction.reply({
    embeds: [successEmbed("Message sent.")],
    ephemeral: true,
  });
}

async function handleAddCommand(interaction, client) {
  const trigger = interaction.options.getString("trigger").toLowerCase();
  const response = interaction.options.getString("response");

  client.data.customCommands.set(trigger, {
    response,
    createdBy: interaction.user.id,
    createdAt: Date.now(),
  });

  await interaction.reply({
    embeds: [
      successEmbed(`Custom command \`${trigger}\` has been added.\n\nUsers can now type \`${trigger}\` to get the response.`),
    ],
    ephemeral: true,
  });
}

async function handleRemoveCommand(interaction, client) {
  const trigger = interaction.options.getString("trigger").toLowerCase();

  if (!client.data.customCommands.has(trigger)) {
    return interaction.reply({
      embeds: [errorEmbed("Command not found.")],
      ephemeral: true,
    });
  }

  client.data.customCommands.delete(trigger);

  await interaction.reply({
    embeds: [successEmbed(`Custom command \`${trigger}\` has been removed.`)],
    ephemeral: true,
  });
}

async function handleListCommands(interaction, client) {
  const commands = Array.from(client.data.customCommands.entries());

  if (commands.length === 0) {
    return interaction.reply({
      embeds: [
        createEmbed({
          title: "Custom Commands",
          description: "No custom commands have been created.",
          color: config.colors.warning,
        }),
      ],
      ephemeral: true,
    });
  }

  const list = commands
    .map(
      ([trigger, data]) =>
        `\`${trigger}\` - Created by <@${data.createdBy}>`
    )
    .join("\n");

  await interaction.reply({
    embeds: [
      createEmbed({
        title: `Custom Commands (${commands.length})`,
        description: list,
        color: config.colors.primary,
      }),
    ],
    ephemeral: true,
  });
}

async function handleRole(interaction, client) {
  const user = interaction.options.getUser("user");
  const role = interaction.options.getRole("role");
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [errorEmbed("User not found in this server.")],
      ephemeral: true,
    });
  }

  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role);
    await interaction.reply({
      embeds: [successEmbed(`Removed ${role} from ${user.tag}.`)],
    });
  } else {
    await member.roles.add(role);
    await interaction.reply({
      embeds: [successEmbed(`Added ${role} to ${user.tag}.`)],
    });
  }
}

async function handleNickname(interaction, client) {
  const user = interaction.options.getUser("user");
  const nickname = interaction.options.getString("nickname");
  const member = interaction.guild.members.cache.get(user.id);

  if (!member) {
    return interaction.reply({
      embeds: [errorEmbed("User not found in this server.")],
      ephemeral: true,
    });
  }

  try {
    await member.setNickname(nickname || null);
    await interaction.reply({
      embeds: [
        successEmbed(
          nickname
            ? `Changed ${user.tag}'s nickname to \`${nickname}\`.`
            : `Reset ${user.tag}'s nickname.`
        ),
      ],
    });
  } catch (error) {
    await interaction.reply({
      embeds: [errorEmbed("Could not change this user's nickname.")],
      ephemeral: true,
    });
  }
}
