const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { verifyOtp } = require('../utils/otpGenerator');
const { getConfig } = require('../utils/database');

module.exports = {
    customID: 'verifyOTP',

    async execute(interaction) {
        const otpModal = new ModalBuilder()
            .setCustomId('otpModal')
            .setTitle('Enter OTP');

        const otpInput = new TextInputBuilder()
            .setCustomId('otpInput')
            .setLabel('One-Time Password (OTP)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the OTP sent to your email')
            .setRequired(true);

        otpModal.addComponents(new ActionRowBuilder().addComponents(otpInput));
        await interaction.showModal(otpModal);
    },

    async handleModal(interaction) {
        try {
            const otp = interaction.fields.getTextInputValue('otpInput').trim();
            const userId = interaction.user.id;
            const guild = interaction.guild;

            const config = getConfig('verificationConfig');
            if (!config || !config.channelId || !config.roleId) {
                console.error('Verification config not found.');
                return await interaction.reply({
                    content: '❌ Verification configuration not found. Please run the setup command first.',
                    ephemeral: true,
                });
            }

            const roleId = config.roleId;
            const result = verifyOtp(userId, otp);

            if (result.valid) {
                const member = await guild.members.fetch(userId);
                const role = guild.roles.cache.get(roleId);

                if (role) {
                    try {
                        console.log(`Attempting to add role: ${role.name} to user: ${member.user.username}`);
                        await member.roles.add(role);
                        await interaction.reply({
                            content: '✅ Verification successful! You now have access and have been assigned the verified role.',
                            ephemeral: true,
                        });
                    } catch (roleError) {
                        console.error('Failed to assign role:', roleError);
                        await interaction.reply({
                            content: '❌ Unable to assign the role. Please check the server settings.',
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        content: '❌ Role not found. Please make sure the role is set up correctly in the server.',
                        ephemeral: true,
                    });
                }
            } else {
                await interaction.reply({
                    content: '❌ Invalid or expired OTP. Please try again.',
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error('Error during OTP verification:', error);
            await interaction.reply({
                content: '❌ An unexpected error occurred. Please try again later.',
                ephemeral: true,
            });
        }
    },
};