import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const featuresPath = path.resolve('./config/features.json');
const features = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));

export default {
  data: new SlashCommandBuilder()
    .setName('toggle')
    .setDescription('Enable or disable a bot feature')
    .addStringOption(option => {
      option
        .setName('feature')
        .setDescription('Choose the feature to enable/disable')
        .setRequired(true);

      // Dynamically add features from features.json
      Object.keys(features).forEach(feature => {
        option.addChoices({ name: feature, value: feature });
      });

      return option;
    })
    .addBooleanOption(option =>
      option
        .setName('enable')
        .setDescription('true = enable, false = disable')
        .setRequired(true)
    ),

  async execute(interaction) {
    const featureName = interaction.options.getString('feature');
    const enable = interaction.options.getBoolean('enable');

    let features;
    try {
      features = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
    } catch {
      return interaction.reply({ content: 'Unable to read the feature configuration file.', ephemeral: true });
    }

    if (!(featureName in features)) {
      return interaction.reply({ content: `The feature \`${featureName}\` does not exist.`, ephemeral: true });
    }

    features[featureName] = enable;

    try {
      fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));
    } catch {
      return interaction.reply({ content: 'Unable to write to features.json.', ephemeral: true });
    }

    return interaction.reply({ content: `The feature \`${featureName}\` has been **${enable ? 'enabled' : 'disabled'}**.`, ephemeral: false });
  },
};
