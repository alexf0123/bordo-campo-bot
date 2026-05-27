const config = require("../config");
const { addXP } = require("../services/xpService");
const { checkAntiSpam } = require("../services/antiSpam");

module.exports = async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!config.LINKED_GUILDS.includes(message.guild.id)) return;

    const spamCheck = await checkAntiSpam(message);

    if (!spamCheck.allowed) return;
    if (!spamCheck.giveXp) return;

    await addXP({
      client: message.client,
      user: message.author,
      amount: config.XP.MESSAGE_OR_COMMAND,
      reason: `Messaggio valido su ${message.guild.name}`,
      sourceGuildId: message.guild.id,
      incrementMessages: true,
    });
  } catch (error) {
    console.error("❌ Errore messageCreate XP/AntiSpam:", error);
  }
};
