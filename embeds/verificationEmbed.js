const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');

const verificationEmbed = (location = 'Not specified') => {
    const embed = new EmbedBuilder()
        .setTitle('Email Verification')
        .setDescription(
            `To verify your email, please use the buttons below.\n\n**Rules for Verification:**\n` +
            `1. Use a valid email address.\n` +
            `2. Check your inbox and spam folder for the OTP email.\n` +
            `3. Enter the OTP within 2 minutes of generation.\n` +
            `4. Avoid sharing your OTP with others.\n\n`
        )
        .setColor(0x3498db)
        .setFooter({ text: 'If you encounter any issues, please reach out for support.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('enterEmail')
                .setLabel('Enter Email')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('verifyOTP')
                .setLabel('Verify OTP')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('support')
                .setLabel('Support')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embed], components: [row] };
};

module.exports = { verificationEmbed };