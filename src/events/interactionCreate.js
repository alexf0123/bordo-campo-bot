const {
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} = require("discord.js");

module.exports = (client) => {

  client.on("interactionCreate", async (interaction) => {

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "ticketpanel") {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: "❌ Non hai permessi.",
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setTitle("🎫 Supporto Bordo Campo")
          .setDescription("Premi un pulsante per aprire un ticket.")
          .setColor("Blue");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_supporto")
            .setLabel("Supporto")
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId("ticket_staff")
            .setLabel("Candidatura Staff")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("ticket_generale")
            .setLabel("Generale")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({
          embeds: [embed],
          components: [row]
        });

        return interaction.reply({
          content: "✅ Ticket panel inviato.",
          ephemeral: true
        });
      }
    }

    if (interaction.isButton()) {

      if (
        interaction.customId === "ticket_supporto" ||
        interaction.customId === "ticket_staff" ||
        interaction.customId === "ticket_generale"
      ) {

        const categoryId = "1499855222862778438";
        const logChannelId = "1498345679511355582";

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: ["ViewChannel"]
            },
            {
              id: interaction.user.id,
              allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
            }
          ]
        });

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Chiudi Ticket")
            .setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
          .setTitle("🎫 Ticket Creato")
          .setDescription("Lo staff risponderà a breve.")
          .setColor("Green");

        await channel.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [closeRow]
        });

        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
          logChannel.send(
            `📁 Ticket creato da ${interaction.user.tag}: ${channel}`
          );
        }

        return interaction.reply({
          content: `✅ Ticket creato: ${channel}`,
          ephemeral: true
        });
      }

      if (interaction.customId === "close_ticket") {

        await interaction.reply({
          content: "🗑️ Ticket chiuso tra 3 secondi...",
          ephemeral: true
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);
      }
    }
  });
};
