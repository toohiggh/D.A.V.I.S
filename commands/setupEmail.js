const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { verificationEmbed } = require('../embeds/verificationEmbed');
const { setConfig } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('email-setup')
        .setDescription('Configure the email verification channel and settings.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the verification channel.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to assign after verification')
                .setRequired(true)),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const location = interaction.options.getString('location') || 'Not specified';

        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                content: '❌ The selected channel is invalid or not found. Please try again.',
                ephemeral: true,
            });
        }

        // Save to the database
        const config = {
            channelId: channel.id,
            roleId: role.id,
            location,
        };
        setConfig('verificationConfig', config);

        console.log('Verification configuration saved:', config);

        // Notify the channel and user
        await channel.send(verificationEmbed(location));
        await interaction.reply({ content: '✅ Verification setup complete!', ephemeral: true });
    },
};