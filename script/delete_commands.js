const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId,token } = require('../config.json');
const guilds = require("../guilds.json");
    
const rest = new REST({ version: '9' }).setToken(token);
/*
for(gID in guilds){
	rest.get(Routes.applicationGuildCommands(clientId, gID))
		.then(data => {
			const promises = [];
			for (const command of data) {
				const deleteUrl = `${Routes.applicationGuildCommands(clientId, gID)}/${command.id}`;
				console.log(deleteUrl);
				promises.push(rest.delete(deleteUrl));
			}
			return Promise.all(promises);
		});
}*/

	rest.get(Routes.applicationCommands(clientId))
		.then(data => {
			const promises = [];
			for (const command of data) {
				const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
				console.log(deleteUrl);
				promises.push(rest.delete(deleteUrl));
			}
			return Promise.all(promises);
		});