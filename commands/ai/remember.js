const { SlashCommandBuilder } = require('discord.js');
const { saveKnowledge } = require('../../functions/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remember')
        .setDescription('Teach the bot a response to a certain topic.')
        .addStringOption(option => 
            option.setName('intent')
                .setDescription('The intent (e.g., twitch, youtube, merch)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('response')
                .setDescription('The response the bot should give')
                .setRequired(true)),

    async execute(interaction) {
        const intent = interaction.options.getString('intent').toLowerCase();
        const response = interaction.options.getString('response');

        saveKnowledge(intent, response);
        await interaction.reply(`I've learned a new response for **${intent}**.`);
    },
};