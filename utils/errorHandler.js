// utils/errorHandler.js

const errorMessages = {
    NO_OTP: '❌ No OTP found. Please request a new one.',
    EXPIRED: '❌ Your OTP has expired. Please request a new one.',
    INVALID: '❌ Invalid OTP. Please try again.',
    FORMAT: '❌ Please enter a valid email address (e.g., example@gmail.com).',
    DOMAIN: `❌ Please use one of these email providers: {allowed_domains}`,
    SMTP_ERROR: '❌ Failed to send email. Please try again later.',
    UNEXPECTED: '❌ An unexpected error occurred. Please try again later.'
};

const handleError = async (interaction, errorType, additionalData = {}) => {
    const message = errorMessages[errorType] || errorMessages.UNEXPECTED;

    if (errorType === 'DOMAIN' && additionalData.allowed_domains) {
        const domainsList = additionalData.allowed_domains.join(', ');
        await interaction.reply({
            content: message.replace('{allowed_domains}', domainsList),
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: message,
            ephemeral: true
        });
    }
};

module.exports = {
    handleError,
};