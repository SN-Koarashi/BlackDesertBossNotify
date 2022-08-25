const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId,token } = require('../config.json');
const guilds = require("../guilds.json");

const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname,'../commands');

const commands = [];
const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(path.join(__dirname,'../commands',file));
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');
		/*
		for(gID in guilds){
			await rest.put(
				Routes.applicationGuildCommands(clientId, gID),
				{ body: commands },
			);
		}*/
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();