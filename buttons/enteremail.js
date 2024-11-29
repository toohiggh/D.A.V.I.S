const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { validateEmail, sendOtpEmail, ALLOWED_DOMAINS } = require('../utils/emailService');
const { generateOtp } = require('../utils/otpGenerator');
const { checkEmailRateLimit, checkEmailLock, lockEmail } = require('../utils/rateLimiter');
const { db } = require('../utils/rateLimiter'); // Ensure the database is imported

module.exports = {
    customId: 'enterEmail',

    async execute(interaction) {
        const emailModal = new ModalBuilder()
            .setCustomId('emailModal')
            .setTitle('Enter Your Email');

        const emailInput = new TextInputBuilder()
            .setCustomId('emailInput')
            .setLabel('Email Address')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('example@gmail.com')
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(320);

        emailModal.addComponents(new ActionRowBuilder().addComponents(emailInput));
        await interaction.showModal(emailModal);
    },

    async handleModal(interaction) {
        try {
            const email = interaction.fields.getTextInputValue('emailInput').trim().toLowerCase();
            const userId = interaction.user.id;

            // Validate email
            const validation = validateEmail(email);
            if (!validation.valid) {
                const errorMessages = {
                    FORMAT: 'Please enter a valid email address (e.g., example@gmail.com).',
                    DOMAIN: `Please use one of these email providers: **${ALLOWED_DOMAINS.join(', ')}**`,
                };

                await interaction.reply({
                    content: errorMessages[validation.reason],
                    ephemeral: true,
                });
                return;
            }

            // Check email lock for email change
            const emailLock = checkEmailLock(userId);
            if (!emailLock.allowed) {
                const retryAfter = Math.ceil(emailLock.retryAfter / 1000);

                // Fetch the locked email from the database
                const lockedEmail = db.prepare('SELECT email FROM email_attempts WHERE userId = ?').get(userId)?.email;

                if (lockedEmail === email) {
                    const rateLimit = checkEmailRateLimit(userId, email);
                    if (!rateLimit.allowed) {
                        const otpRetryAfter = Math.ceil(rateLimit.retryAfter / 1000);
                        await interaction.reply({
                            content: `⏳ You can resend the OTP for this email in **${otpRetryAfter} seconds**.`,
                            ephemeral: true,
                        });
                    } else {
                        await interaction.deferReply({ ephemeral: true });
                        const otp = generateOtp(userId);
                        try {
                            await sendOtpEmail(email, otp);
                            await interaction.editReply({
                                content: '✅ OTP has been resent to your email. Please check your inbox.',
                            });
                        } catch (error) {
                            console.error('Failed to resend email:', error);
                            await interaction.editReply({
                                content: '❌ Failed to resend email. Please try again later.',
                            });
                        }
                    }
                } else {
                    await interaction.reply({
                        content: `⏳ You can change your email in **${retryAfter} seconds**. Please verify the OTP sent to your current email.`,
                        ephemeral: true,
                    });
                }
                return;
            }

            // New email request
            await interaction.deferReply({ ephemeral: true });

            const otp = generateOtp(userId);
            lockEmail(userId, email); // Lock the email for 10 minutes
            console.log(`Generated OTP for ${userId}: ${otp} (expires in 2 minutes)`);

            try {
                await sendOtpEmail(email, otp);
                await interaction.editReply({
                    content: '✅ OTP has been sent to your email. Please check your inbox.',
                });
            } catch (error) {
                console.error('Failed to send email:', error);
                await interaction.editReply({
                    content: '❌ Failed to send email. Please try again later.',
                });
            }
        } catch (error) {
            console.error('Error in email verification:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred. Please try again later.',
                    ephemeral: true,
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ An error occurred. Please try again later.',
                });
            }
        }
    },
};
