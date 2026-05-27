const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField,
} = require("discord.js");

const config = require("../config");
const supabase = require("../database");
const createProfileCard = require("../cards/profileCard");
const { addXP } = require("../services/xpService");

const STAFF_ROLE_ID = "1498341567105339492";

const STAFF_LOG_CHANNEL_ID = config.CHANNELS.STAFF_LOGS;
const TICKET_PANEL_CHANNEL_ID = config.CHANNELS.TICKET_PANEL;
const TICKET_CATEGORY_ID = config.TICKETS.CATEGORY_ID;

function calculateLevel(xp) {
  let level = 0;

  for (const lvl in config.LEVEL_XP) {
    if (xp >= config.LEVEL_XP[lvl]) {
      level = Number(lvl);
    }
  }

  return level;
}

function getNextXp(level) {
  const nextLevel = Math.min((level || 0) + 1, 5);
  return config.LEVEL_XP[nextLevel] || config.LEVEL_XP[5] || 2500;
}

async function getUserRank(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, xp")
    .order("xp", { ascending: false });

  if (error || !data) return "-";

  const index = data.findIndex((u) => u.user_id === userId);
  return index === -1 ? "-" : index + 1;
}

async function sendStaffLog(guild, content, embed = null) {
  const logChannel = await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (!logChannel) return;

  if (embed) {
    return logChannel.send({ content: content || "", embeds: [embed] }).catch(() => null);
  }

  return logChannel.send({ content }).catch(() => null);
}

async function handleProfilo(interaction) {
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

  const rank = await getUserRank(interaction.user.id);
  const level = user.level || 0;
  const xp = user.xp || 0;
  const nextXp = getNextXp(level);

  const card = await createProfileCard(
    {
      username: interaction.user.username,
      level,
      xp,
      rank,
      messages: user.messages || 0,
      streak: user.streak || 0,
      currentXp: xp,
      requiredXp: nextXp,
    },
    interaction.user.displayAvatarURL({
      extension: "png",
      forceStatic: true,
      size: 512,
    })
  );

  return interaction.editReply({
    files: [card],
  });
}

async function handleClassifica(interaction) {
  if (interaction.channelId !== config.CHANNELS.LEVELS) {
    return interaction.reply({
      content: "❌ Puoi usare `/classifica` solo nel canale LIVELLI.",
      flags: 64,
    });
  }

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

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏅 Classifica Globale BC")
    .setDescription(text)
    .setFooter({ text: "Bordo Campo | Leaderboard" });

  return interaction.reply({ embeds: [embed] });
}

async function handleRimuoviXp(interaction) {
  if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
    return interaction.reply({
      content: "❌ Non hai il permesso per usare questo comando.",
      flags: 64,
    });
  }

  const target = interaction.options.getUser("utente");
  const amount = interaction.options.getInteger("quantita");

  const { data: targetUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", target.id)
    .single();

  if (error || !targetUser) {
    return interaction.reply({
      content: "❌ Questo utente non ha ancora dati XP nel database.",
      flags: 64,
    });
  }

  const oldXp = targetUser.xp || 0;
  const newXp = Math.max(0, oldXp - amount);
  const oldLevel = targetUser.level || 0;
  const newLevel = calculateLevel(newXp);

  await supabase
    .from("users")
    .update({
      xp: newXp,
      level: newLevel,
    })
    .eq("user_id", target.id);

  const mainGuild = await interaction.client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
  const member = await mainGuild?.members.fetch(target.id).catch(() => null);

  if (member) {
    const levelRoles = Object.values(config.LEVEL_ROLES || {});
    if (levelRoles.length) await member.roles.remove(levelRoles).catch(() => null);

    const newRoleId = config.LEVEL_ROLES?.[newLevel];
    if (newRoleId) await member.roles.add(newRoleId).catch(() => null);
  }

  const staffLogs = await interaction.guild.channels
    .fetch(config.CHANNELS.STAFF_LOGS)
    .catch(() => null);

  if (staffLogs) {
    await staffLogs
      .send(
        [
          "🧾 **XP RIMOSSI DA STAFF**",
          `Staff: ${interaction.user.tag} (${interaction.user.id})`,
          `Utente: ${target.tag} (${target.id})`,
          `XP rimossi: ${amount}`,
          `XP prima: ${oldXp}`,
          `XP dopo: ${newXp}`,
          `Livello prima: ${oldLevel}`,
          `Nuovo livello: ${newLevel}`,
        ].join("\n")
      )
      .catch(() => null);
  }

  try {
    await target.send(
      `📉 Ti sono stati rimossi **${amount} XP** su Bordo Campo.\nXP attuali: **${newXp}**\nLivello attuale: **${newLevel}**`
    );
  } catch {}

  return interaction.reply({
    content: `✅ Rimossi **${amount} XP** a ${target}. Nuovi XP: **${newXp}**, livello: **${newLevel}**.`,
    flags: 64,
  });
}

function getTicketInfo(customId) {
  const types = {
    ticket_tecnica: {
      label: "Assistenza Tecnica",
      emoji: "🛠️",
      channelPrefix: "ticket-tecnico",
      color: 0x3498db,
      description: "Descrivi il problema tecnico nel modo più chiaro possibile. Lo staff ti risponderà appena possibile.",
    },
    ticket_staff: {
      label: "Candidatura Staff",
      emoji: "🧑‍💼",
      channelPrefix: "ticket-staff",
      color: 0x2ecc71,
      description: "Scrivi la tua candidatura, la tua esperienza e perché vuoi entrare nello staff.",
    },
    ticket_generale: {
      label: "Assistenza Generale",
      emoji: "💬",
      channelPrefix: "ticket-generale",
      color: 0xf1c40f,
      description: "Spiega la tua richiesta generale. Lo staff ti risponderà appena possibile.",
    },
  };

  return types[customId] || null;
}

async function sendTicketPanel(interaction) {
  const panelChannel = await interaction.guild.channels.fetch(TICKET_PANEL_CHANNEL_ID).catch(() => null);

  if (!panelChannel) {
    return interaction.reply({
      content: "❌ Non trovo il canale pannello ticket. Controlla l'ID in config.js.",
      flags: 64,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xffd43b)
    .setTitle("🎫 Centro Assistenza — Bordo Campo")
    .setDescription(
      [
        "**Benvenuto nel supporto ufficiale!**",
        "",
        "Se hai bisogno di aiuto, scegli una delle opzioni qui sotto.",
        "",
        "⚠️ **Nota:** Apri un ticket solo per motivi validi.",
        "Lo staff ti risponderà il prima possibile.",
      ].join("\n")
    )
    .setFooter({ text: "Bordo Campo | Sistema di Supporto Automatico" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_tecnica")
      .setLabel("Assistenza Tecnica")
      .setEmoji("🛠️")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("ticket_staff")
      .setLabel("Candidatura Staff")
      .setEmoji("🧑‍💼")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("ticket_generale")
      .setLabel("Assistenza Generale")
      .setEmoji("💬")
      .setStyle(ButtonStyle.Secondary)
  );

  await panelChannel.send({
    embeds: [embed],
    components: [row],
  });

  await interaction.reply({
    content: `✅ Pannello ticket inviato in <#${TICKET_PANEL_CHANNEL_ID}>.`,
    flags: 64,
  });

  await sendStaffLog(
    interaction.guild,
    `📌 **Pannello ticket inviato** da ${interaction.user.tag} in <#${TICKET_PANEL_CHANNEL_ID}>`
  );
}

async function createTicket(interaction, info) {
  const existing = interaction.guild.channels.cache.find(
    (channel) =>
      channel.parentId === TICKET_CATEGORY_ID &&
      channel.topic === `ticket-user:${interaction.user.id}` &&
      channel.name.startsWith(info.channelPrefix)
  );

  if (existing) {
    return interaction.reply({
      content: `⚠️ Hai già un ticket aperto: ${existing}`,
      flags: 64,
    });
  }

  const safeUsername =
    interaction.user.username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) || "utente";

  const ticketChannel = await interaction.guild.channels.create({
    name: `${info.channelPrefix}-${safeUsername}`,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID,
    topic: `ticket-user:${interaction.user.id}`,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks,
        ],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ReadMessageHistory,
        ],
      },
    ],
  });

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Chiudi Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  const ticketEmbed = new EmbedBuilder()
    .setColor(info.color)
    .setTitle(`${info.emoji} ${info.label}`)
    .setDescription(
      [
        `Ciao ${interaction.user}, benvenuto nel tuo ticket.`,
        "",
        info.description,
        "",
        "📌 Attendi la risposta dello staff.",
        "🔒 Quando il problema è risolto, premi **Chiudi Ticket**.",
      ].join("\n")
    )
    .setFooter({ text: "Bordo Campo | Sistema Ticket" });

  await ticketChannel.send({
    content: `${interaction.user}`,
    embeds: [ticketEmbed],
    components: [closeRow],
  });

  await interaction.reply({
    content: `✅ Ticket creato: ${ticketChannel}`,
    flags: 64,
  });

  const logEmbed = new EmbedBuilder()
    .setColor(info.color)
    .setTitle("🎫 Nuovo Ticket Aperto")
    .addFields(
      { name: "Utente", value: `${interaction.user.tag}\n${interaction.user.id}`, inline: true },
      { name: "Tipo", value: `${info.emoji} ${info.label}`, inline: true },
      { name: "Canale", value: `${ticketChannel}`, inline: true }
    )
    .setTimestamp();

  await sendStaffLog(interaction.guild, "", logEmbed);
}

async function closeTicket(interaction) {
  const openerId = interaction.channel.topic?.replace("ticket-user:", "") || "Sconosciuto";

  const logEmbed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("🔒 Ticket Chiuso")
    .addFields(
      { name: "Canale", value: `${interaction.channel.name}`, inline: true },
      {
        name: "Aperto da",
        value: openerId !== "Sconosciuto" ? `<@${openerId}>` : "Sconosciuto",
        inline: true,
      },
      { name: "Chiuso da", value: `${interaction.user.tag}`, inline: true }
    )
    .setTimestamp();

  await sendStaffLog(interaction.guild, "", logEmbed);

  await interaction.reply({
    content: "🔒 Ticket chiuso. Il canale verrà eliminato tra 5 secondi.",
    flags: 64,
  });

  setTimeout(async () => {
    await interaction.channel.delete("Ticket chiuso").catch(() => null);
  }, 5000);
}

module.exports = async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "profilo") {
        return handleProfilo(interaction);
      }

      if (interaction.commandName === "classifica") {
        return handleClassifica(interaction);
      }

      if (interaction.commandName === "rimuovi_xp") {
        return handleRimuoviXp(interaction);
      }

      if (
        config.LINKED_GUILDS.includes(interaction.guildId) &&
        !["profilo", "classifica", "ticketpanel", "rimuovi_xp"].includes(interaction.commandName)
      ) {
        await addXP({
          client: interaction.client,
          user: interaction.user,
          amount: config.XP.MESSAGE_OR_COMMAND,
          reason: `Comando /${interaction.commandName}`,
          sourceGuildId: interaction.guildId,
          incrementMessages: false,
        });
      }

      if (interaction.commandName === "ticketpanel") {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: "❌ Non hai il permesso per usare questo comando.",
            flags: 64,
          });
        }

        return sendTicketPanel(interaction);
      }
    }

    if (interaction.isButton()) {
      const ticketInfo = getTicketInfo(interaction.customId);

      if (ticketInfo) {
        return createTicket(interaction, ticketInfo);
      }

      if (interaction.customId === "ticket_close") {
        return closeTicket(interaction);
      }
    }
  } catch (error) {
    console.error("❌ Errore interactionCreate:", error);

    if (interaction.isRepliable()) {
      const payload = {
        content: "❌ Si è verificato un errore nel sistema ticket/XP.",
        flags: 64,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  }
};
