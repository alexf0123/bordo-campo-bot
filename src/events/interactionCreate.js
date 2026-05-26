const {
  AttachmentBuilder,
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
const { addXP } = require("../services/xpService");
const { createProfileCard } = require("../cards/profileCard");

const STAFF_LOG_CHANNEL_ID = config.CHANNELS.STAFF_LOGS;
const TICKET_PANEL_CHANNEL_ID = config.CHANNELS.TICKET_PANEL;
const TICKET_CATEGORY_ID = config.TICKETS.CATEGORY_ID;

async function getUserRank(userId) {
  const { data } = await supabase
    .from("users")
    .select("user_id, xp")
    .order("xp", { ascending: false });

  if (!data) return "-";
  const index = data.findIndex((u) => u.user_id === userId);
  return index === -1 ? "-" : index + 1;
}

async function handleProfilo(interaction) {
  await interaction.deferReply();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", interaction.user.id)
    .single();

  if (error || !user) {
    return interaction.editReply("Non hai ancora dati XP. Scrivi qualche messaggio valido per iniziare.");
  }

  const rank = await getUserRank(interaction.user.id);

  const buffer = await createProfileCard({
    username: interaction.user.username,
    avatarUrl: interaction.user.displayAvatarURL({ extension: "png", size: 256 }),
    level: user.level || 0,
    xp: user.xp || 0,
    messages: user.messages || 0,
    streak: user.streak || 0,
    rank,
    levelXp: config.LEVEL_XP,
  });

  const attachment = new AttachmentBuilder(buffer, {
    name: "profilo-bordo-campo.png",
  });

  return interaction.editReply({
    content: "",
    embeds: [],
    files: [attachment],
  });
}

async function handleClassifica(interaction) {
  if (interaction.channelId !== config.CHANNELS.LEVELS) {
    return interaction.reply({
      content: "❌ Puoi usare `/classifica` solo nel canale LIVELLI.",
      flags: 64,
    });
  }

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("xp", { ascending: false })
    .limit(10);

  if (!users || users.length === 0) {
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

async function sendStaffLog(guild, content, embed = null) {
  const logChannel = await guild.channels.fetch(STAFF_LOG_CHANNEL_ID).catch(() => null);
  if (!logChannel) return;
  if (embed) return logChannel.send({ content: content || "", embeds: [embed] }).catch(() => null);
  return logChannel.send({ content }).catch(() => null);
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
    .setDescription([
      "**Benvenuto nel supporto ufficiale!**",
      "",
      "Se hai bisogno di aiuto, scegli una delle opzioni qui sotto.",
      "",
      "⚠️ **Nota:** Apri un ticket solo per motivi validi.",
      "Lo staff ti risponderà il prima possibile.",
    ].join("\n"))
    .setFooter({ text: "Bordo Campo | Sistema di Supporto Automatico" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_tecnica").setLabel("Assistenza Tecnica").setEmoji("🛠️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_staff").setLabel("Candidatura Staff").setEmoji("🧑‍💼").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ticket_generale").setLabel("Assistenza Generale").setEmoji("💬").setStyle(ButtonStyle.Secondary)
  );

  await panelChannel.send({ embeds: [embed], components: [row] });

  await interaction.reply({
    content: `✅ Pannello ticket inviato in <#${TICKET_PANEL_CHANNEL_ID}>.`,
    flags: 64,
  });

  await sendStaffLog(interaction.guild, `📌 **Pannello ticket inviato** da ${interaction.user.tag} in <#${TICKET_PANEL_CHANNEL_ID}>`);
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

  const safeUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "utente";

  const ticketChannel = await interaction.guild.channels.create({
    name: `${info.channelPrefix}-${safeUsername}`,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID,
    topic: `ticket-user:${interaction.user.id}`,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
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
    new ButtonBuilder().setCustomId("ticket_close").setLabel("Chiudi Ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger)
  );

  const ticketEmbed = new EmbedBuilder()
    .setColor(info.color)
    .setTitle(`${info.emoji} ${info.label}`)
    .setDescription([
      `Ciao ${interaction.user}, benvenuto nel tuo ticket.`,
      "",
      info.description,
      "",
      "📌 Attendi la risposta dello staff.",
      "🔒 Quando il problema è risolto, premi **Chiudi Ticket**.",
    ].join("\n"))
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
      { name: "Aperto da", value: openerId !== "Sconosciuto" ? `<@${openerId}>` : "Sconosciuto", inline: true },
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
      if (interaction.commandName === "profilo") return handleProfilo(interaction);

      if (
        config.LINKED_GUILDS.includes(interaction.guildId) &&
        !["profilo", "classifica", "ticketpanel"].includes(interaction.commandName)
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

      if (interaction.commandName === "classifica") return handleClassifica(interaction);

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
      if (ticketInfo) return createTicket(interaction, ticketInfo);
      if (interaction.customId === "ticket_close") return closeTicket(interaction);
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
