import { createEmbed } from "../utils/embedBuilder.js";
import { config } from "../config.js";

export default {
  name: "guildMemberRemove",
  async execute(member, client) {
    // Leave message
    if (config.leave.enabled && config.leave.channelId) {
      const channel = member.guild.channels.cache.get(config.leave.channelId);
      if (channel) {
        const message = formatMessage(config.leave.message, member);

        await channel.send({
          embeds: [
            createEmbed({
              title: "Member Left",
              description: message,
              color: config.colors.error,
              thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
              footer: `ID: ${member.id}`,
            }),
          ],
        });
      }
    }

    // Logging
    if (config.logging.enabled && config.logging.logLeaves && config.logging.channelId) {
      const logChannel = member.guild.channels.cache.get(config.logging.channelId);
      if (logChannel) {
        const roles = member.roles.cache
          .filter((r) => r.id !== member.guild.id)
          .map((r) => r.toString())
          .join(", ") || "None";

        await logChannel.send({
          embeds: [
            createEmbed({
              title: "Member Left",
              description: `${member.user.tag} (${member})`,
              color: config.colors.error,
              thumbnail: member.user.displayAvatarURL({ dynamic: true }),
              fields: [
                {
                  name: "Joined",
                  value: member.joinedAt
                    ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                    : "Unknown",
                  inline: true,
                },
                {
                  name: "Member Count",
                  value: member.guild.memberCount.toString(),
                  inline: true,
                },
                {
                  name: "Roles",
                  value: roles.length > 1024 ? roles.slice(0, 1020) + "..." : roles,
                },
              ],
              footer: `User ID: ${member.id}`,
            }),
          ],
        });
      }
    }
  },
};

function formatMessage(message, member) {
  return message
    .replace(/{user}/g, member.user.tag)
    .replace(/{username}/g, member.user.username)
    .replace(/{tag}/g, member.user.tag)
    .replace(/{server}/g, member.guild.name)
    .replace(/{memberCount}/g, member.guild.memberCount.toString());
}
