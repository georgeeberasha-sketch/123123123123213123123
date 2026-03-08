import { createEmbed } from "../utils/embedBuilder.js";
import { config } from "../config.js";

export default {
  name: "guildMemberAdd",
  async execute(member, client) {
    if (!config.welcome.enabled) return;

    // Auto role
    if (config.welcome.autoRoleId) {
      try {
        await member.roles.add(config.welcome.autoRoleId);
      } catch (error) {
        console.error("Error adding auto role:", error);
      }
    }

    // Welcome channel message
    if (config.welcome.channelId) {
      const channel = member.guild.channels.cache.get(config.welcome.channelId);
      if (channel) {
        const message = formatMessage(config.welcome.message, member);

        if (config.welcome.embedEnabled) {
          const embed = createEmbed({
            title: "Welcome!",
            description: message,
            color: config.colors.success,
            thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
            fields: [
              {
                name: "Account Created",
                value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                inline: true,
              },
              {
                name: "Member #",
                value: member.guild.memberCount.toString(),
                inline: true,
              },
            ],
            footer: `ID: ${member.id}`,
          });

          await channel.send({ embeds: [embed] });
        } else {
          await channel.send(message);
        }
      }
    }

    // DM welcome
    if (config.welcome.dmEnabled && config.welcome.dmMessage) {
      try {
        const dmMessage = formatMessage(config.welcome.dmMessage, member);
        await member.send({
          embeds: [
            createEmbed({
              title: `Welcome to ${member.guild.name}!`,
              description: dmMessage,
              color: config.colors.primary,
              thumbnail: member.guild.iconURL({ dynamic: true, size: 256 }),
            }),
          ],
        });
      } catch (error) {
        // User might have DMs disabled
        console.log(`Could not DM ${member.user.tag}`);
      }
    }

    // Logging
    if (config.logging.enabled && config.logging.logJoins && config.logging.channelId) {
      const logChannel = member.guild.channels.cache.get(config.logging.channelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [
            createEmbed({
              title: "Member Joined",
              description: `${member} (${member.user.tag})`,
              color: config.colors.success,
              thumbnail: member.user.displayAvatarURL({ dynamic: true }),
              fields: [
                {
                  name: "Account Age",
                  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                  inline: true,
                },
                {
                  name: "Member Count",
                  value: member.guild.memberCount.toString(),
                  inline: true,
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
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{tag}/g, member.user.tag)
    .replace(/{server}/g, member.guild.name)
    .replace(/{memberCount}/g, member.guild.memberCount.toString());
}
