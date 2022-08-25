const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('叮噹響叮噹，跟機器人打招呼'),
	async execute(interaction) {
		await interaction.reply('Pong!!');
	},
};