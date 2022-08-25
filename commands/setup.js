require("../global.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('建立廣播頻道')
		.addSubcommand(subcommand =>
			subcommand
				.setName('set')
				.setDescription('建立廣播頻道')
				.addChannelOption(option => option.setName('channel').setDescription('廣播頻道').setRequired(true))
				.addRoleOption(option => option.setName('role').setDescription('廣播時提及的身分組').setRequired(false))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('刪除廣播頻道及相關資料')
		),
	async execute(interaction) {
		if(interaction.member.user.bot) return;
		if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
			await interaction.reply({content: "權限不足", ephemeral: true});
			return;
		}
			
		const guild = interaction.guild;
		if(interaction.options.getSubcommand() == "set"){
			var AcceptType = ["GUILD_TEXT","GUILD_PUBLIC_THREAD","GUILD_PRIVATE_THREAD"];
			if(AcceptType.indexOf(interaction.options.getChannel('channel').type) < 0){
				await interaction.reply({content: "您必須選擇討論串或是文字頻道", ephemeral: true});
				return;
			}
			
			
			var channelID = interaction.options.getChannel('channel').id;
			var roleID = (interaction.options.getRole('role'))?interaction.options.getRole('role').id:"";
			
			guilds[guild.id] = {
				channels: channelID,
				role: roleID
			};
			var savingStr = JSON.stringify(guilds);
			fs.writeFileSync(path.join(__dirname,'../guilds.json'), savingStr);
			await interaction.reply({content: "建立完成", ephemeral: true});
		}
		if(interaction.options.getSubcommand() == "delete"){

			delete guilds[guild.id];
			
			var savingStr = JSON.stringify(guilds);
			fs.writeFileSync(path.join(__dirname,'../guilds.json'), savingStr);
			await interaction.reply({content: "刪除完成", ephemeral: true});
		}
	},
};