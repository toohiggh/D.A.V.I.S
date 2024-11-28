// make a support yourself lol, I don't have time to do this shit.
module.exports = {
    customID: 'support',
    async execute(interaction) {
        await interaction.reply({
            content: 'If you encounter any issues with verification, Please email us at diddy@help.me',
            ephemeral: true
        });
    }
};