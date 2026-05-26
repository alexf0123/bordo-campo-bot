require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
} = require("discord.js");

const supabase = require("./database");
const config = require("./config");
const messageCreate = require("./events/messageCreate");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
  ],
});

client.once("clientReady", () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
  console.log("✅ Supabase collegato");
});

client.on("messageCreate", messageCreate);

client.login(process.env.DISCORD_TOKEN);
