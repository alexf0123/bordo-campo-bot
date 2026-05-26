const config = require("../config");
const { addXP } = require("../services/xpService");

module.exports = async (oldMember, newMember) => {
  try {
    if (!newMember.guild) return;
    if (!config.LINKED_GUILDS.includes(newMember.guild.id)) return;
    if (newMember.user.bot) return;

    const oldRoleIds = new Set(oldMember.roles.cache.map((role) => role.id));
    const newRoleIds = new Set(newMember.roles.cache.map((role) => role.id));

    for (const roleId of newRoleIds) {
      if (oldRoleIds.has(roleId)) continue;

      const rewardXP = config.XP.ROLE_REWARDS[roleId];

      if (!rewardXP) continue;

      const role = newMember.guild.roles.cache.get(roleId);
      const roleName = role ? role.name : roleId;

      await addXP({
        client: newMember.client,
        user: newMember.user,
        amount: rewardXP,
        reason: `Ruolo ricevuto: ${roleName} su ${newMember.guild.name}`,
        sourceGuildId: newMember.guild.id,
        incrementMessages: false,
      });

      const mainGuild = await newMember.client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
      const staffLogs = await mainGuild?.channels.fetch(config.CHANNELS.STAFF_LOGS).catch(() => null);

      if (staffLogs) {
        await staffLogs.send(
          `🎖️ **XP RUOLO**\nUtente: ${newMember.user.tag} (${newMember.user.id})\nServer: ${newMember.guild.name}\nRuolo: ${roleName}\nXP assegnati: +${rewardXP}`
        ).catch(() => null);
      }
    }
  } catch (error) {
    console.error("❌ Errore guildMemberUpdate XP:", error);
  }
};
