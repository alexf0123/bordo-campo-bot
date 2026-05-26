require("dotenv").config();

const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("./config");

const commands = [
  new SlashCommandBuilder()
    .setName("profilo")
    .setDescription("Mostra il tuo profilo XP e livello"),

  new SlashCommandBuilder()
    .setName("classifica")
    .setDescription("Mostra la classifica globale BC"),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Invia il pannello ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("⏳ Registrazione comandi slash...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        config.MAIN_GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Comandi slash registrati su BORDO CAMPO");
  } catch (error) {
    console.error("❌ Errore registrazione comandi:", error);
  }
})();
