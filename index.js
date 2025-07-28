import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import schedule from 'node-schedule';

// Bot initialization
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, 
  ]
});
client.commands = new Collection();

// ====== Load commands ======
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if (!command.default || !command.default.data) {
        console.warn(`⚠️ Command file ${file} is missing a default export or 'data' property.`);
        continue;
    }
    client.commands.set(command.default.data.name, command.default);
    console.log(`✅ Command loaded: ${command.default.data.name}`);
}

// ====== Load config files ======
const channelsPath = path.resolve('./config/channels.json');
const featuresPath = path.resolve('./config/features.json');

let channels = {};
let features = {};

try {
    channels = JSON.parse(fs.readFileSync(channelsPath, 'utf8'));
    console.log("✅ Channels configuration loaded");
} catch (err) {
    console.error("❌ Error reading channels.json:", err);
}

try {
    features = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
    console.log("✅ Features configuration loaded");
} catch (err) {
    console.error("❌ Error reading features.json:", err);
}

// ====== Event handling ======
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    import('./features/logbookReminder.js').then(module => module.default(client, channels, features));
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Check if the command is linked to a feature
    if (features[interaction.commandName] === false) {
        return interaction.reply({ 
            content: `⚠️ The command \`/${interaction.commandName}\` is currently disabled.`,
            ephemeral: true 
        });
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
