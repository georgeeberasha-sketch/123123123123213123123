import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";

export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || config.colors.primary)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.author)
    embed.setAuthor({
      name: options.author.name,
      iconURL: options.author.icon,
    });
  if (options.fields) embed.addFields(options.fields);

  return embed;
}

export function successEmbed(description, title = "Success") {
  return createEmbed({
    title,
    description,
    color: config.colors.success,
  });
}

export function errorEmbed(description, title = "Error") {
  return createEmbed({
    title,
    description,
    color: config.colors.error,
  });
}

export function warningEmbed(description, title = "Warning") {
  return createEmbed({
    title,
    description,
    color: config.colors.warning,
  });
}

export function cs2Embed(description, title = "CS2") {
  return createEmbed({
    title,
    description,
    color: config.colors.cs2,
  });
}
