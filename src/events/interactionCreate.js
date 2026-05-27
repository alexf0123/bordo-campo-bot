const { AttachmentBuilder } = require("discord.js");
const config = require("../config");
const supabase = require("../database");
const { createProfileCard } = require("../cards/profileCard");

async function getUserRank(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, xp")
    .order("xp", { ascending: false });

  if (error || !data) return "-";

  const index = data.findIndex((u) => u.user_id === userId);
  return index === -1 ? "-" : index + 1;
}

function getNextXp(level, levelXp) {
  const nextLevel = Math.min((level || 0) + 1, 5);
  return levelXp[nextLevel] || levelXp[5] || 2500;
}

module.exports = async function interactionCreate(interaction) {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "profilo") {
      await interaction.deferReply();

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", interaction.user.id)
        .single();

      if (error || !user) {
        return interaction.editReply({
          content: "Non hai ancora dati XP. Scrivi qualche messaggio valido per iniziare.",
        });
      }

      const level = user.level || 0;
      const xp = user.xp || 0;
      const nextXp = getNextXp(level, config.LEVEL_XP);
      const rank = await getUserRank(interaction.user.id);

      const card = await createProfileCard(
        {
          username: interaction.user.username.toUpperCase(),
          level,
          xp,
          rank,
          messages: user.messages || 0,
          streak: user.streak || 0,
          currentXp: xp,
          requiredXp: nextXp,
        },
        interaction.user.displayAvatarURL({ extension: "png", size: 512 })
      );

      return interaction.editReply({
        files: [card],
      });
    }

    if (interaction.commandName === "classifica") {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("xp", { ascending: false })
        .limit(10);

      if (error || !users || users.length === 0) {
        return interaction.reply({
          content: "Nessun dato classifica disponibile.",
          flags: 64,
        });
      }

      const text = users
        .map((u, i) => `**${i + 1}.** <@${u.user_id}> — Livello ${u.level || 0} — ${u.xp || 0} XP`)
        .join("\n");

      return interaction.reply({
        content: `🏆 **Classifica Globale BC**\n\n${text}`,
      });
    }

  } catch (error) {
    console.error("Errore interactionCreate:", error);

    if (interaction.isRepliable()) {
      const payload = {
        content: "Errore durante l'esecuzione del comando.",
        flags: 64,
      };

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(payload).catch(() => null);
      }

      return interaction.reply(payload).catch(() => null);
    }
  }
};
