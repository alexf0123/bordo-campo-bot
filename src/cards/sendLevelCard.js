const { AttachmentBuilder } = require("discord.js");
const { createLevelCard } = require("../cards/levelCard");
const config = require("../config");

async function sendLevelCard(client, user, data) {
  const guild = await client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
  if (!guild) return;

  const channel = await guild.channels.fetch(config.CHANNELS.LEVELS).catch(() => null);
  if (!channel) return;

  const cardBuffer = await createLevelCard({
    username: user.username,
    avatarUrl: user.displayAvatarURL({ extension: "png", size: 256 }),
    ...data,
  });

  const attachment = new AttachmentBuilder(cardBuffer, {
    name: "level-card.png",
  });

  await channel.send({
    content: data.type === "up"
      ? `🎉 GG ${user}, hai raggiunto il **LIVELLO ${data.level}**!`
      : data.type === "down"
      ? `📉 ${user}, sei sceso al **LIVELLO ${data.level}**.`
      : data.type === "reset"
      ? `🚨 ${user}, i tuoi livelli sono stati azzerati per inattività.`
      : `🔥 ${user}, streak attività completata!`,
    files: [attachment],
  });

  try {
    await user.send({
      content: data.type === "up"
        ? `🎉 Complimenti! Hai raggiunto il **LIVELLO ${data.level}** su Bordo Campo.`
        : data.type === "down"
        ? `📉 Sei sceso al **LIVELLO ${data.level}** per inattività.`
        : data.type === "reset"
        ? `🚨 I tuoi livelli sono stati azzerati per inattività.`
        : `🔥 Hai ricevuto un bonus streak!`,
      files: [attachment],
    });
  } catch (err) {}
}

module.exports = { sendLevelCard };
