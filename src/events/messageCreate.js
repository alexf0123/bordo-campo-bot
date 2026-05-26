const config = require("../config");
const { addXP } = require("../services/xpService");

module.exports = async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (!config.LINKED_GUILDS.includes(message.guild.id)) return;

    // Ogni messaggio valido sui server collegati dà XP globale.
    // Tutto viene salvato nello stesso profilo utente Supabase/Bordo Campo.
    await addXP({
      client: message.client,
      user: message.author,
      amount: config.XP.MESSAGE_OR_COMMAND,
      reason: `Messaggio su ${message.guild.name}`,
      sourceGuildId: message.guild.id,
      incrementMessages: true,
    });
  } catch (error) {
    console.error("❌ Errore messageCreate XP:", error);
  }
};
