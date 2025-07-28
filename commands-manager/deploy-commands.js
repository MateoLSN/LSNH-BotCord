import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const commands = [];
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`../commands/${file}`);
  if (command.default && command.default.data) {
    commands.push(command.default.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  console.log(`🔄 Deploying ${commands.length} command(s)...`);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );

  console.log('✅ Commands deployed successfully.');
} catch (error) {
  console.error(error);
}
