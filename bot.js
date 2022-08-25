require("./global.js");
const {Client, MessageEmbed, Intents, Collection, Permissions} = require('discord.js');
const path = require('path');
const fs = require('fs-extra');
const config = require("./config.json");

//const guilds = require("./guilds.json");
const myIntents = new Intents();
myIntents.add(
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_INTEGRATIONS
);
const bot = new Client({ intents: myIntents });
bot.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	bot.commands.set(command.data.name, command);
}

var notice = new Object();
var nextBoss = new Array();
var sendMentions = false;
var session = null;

if(fs.existsSync(path.join(__dirname,'session.json'))) session = JSON.parse(fs.readFileSync(path.join(__dirname,'session.json')).toString());

bot.on('error', (err) => {
   console.log(err.message);
});

bot.on('ready', () => {
  console.log("Ready!");
  initializationObj(session,false);
  
  bot.user.setActivity("• STARTING •", {type: "WATCHING"});
  
  setInterval(function(){
	//const guilds = JSON.parse(fs.readFileSync(path.join(__dirname,'guilds.json')).toString());
	
	let date = new Date();
	let nowDate = new Date(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} 00:00:00`).getTime();
	let theWeeks = [
		[date.getDay(),nowDate],
		[(date.getDay()+1 == 7)?0:date.getDay()+1,new Date(nowDate+86400000).getTime()]
	];

	if(nextBoss.length){
		bot.user.setActivity("• " + nextBoss[0] + " - "+nextBoss[1].join('/')+" •", {type: "WATCHING"});
		nextBoss = [];
	}
	
	for(let theWeek of theWeeks){
		if(!notice[theWeek[0]]) initializationObj(null,true);
		
		let forInDate = new Date(theWeek[1]);
		let totalGuilds = Object.getOwnPropertyNames(guilds).length;
		let idx = 0;
		
		for(let gID in guilds){
			idx++;
			sendMentions = false;
			
			let channel = bot.guilds.cache.get(gID).channels.cache.get(guilds[gID].channels);
			let role = bot.guilds.cache.get(gID).roles.cache.get(guilds[gID].role);
			let bosses = config.bosses;

			if(!channel || !checkPerms(channel,bot.guilds.cache.get(gID))) continue;
			
			for(let b in bosses){
				if(b == theWeek[0]){
					let dayBosses = bosses[b];
				
					for(let db in dayBosses){
						let targetDate = new Date(`${forInDate.getFullYear()}-${forInDate.getMonth()+1}-${forInDate.getDate()} ${db}:00`);
						let timestamp = (targetDate.getTime());
						let diff = timestamp - date.getTime();
						
						if( diff > 0 && !nextBoss.length)
							nextBoss = [db,dayBosses[db]];

						if(diff < 1800000 && diff > 0 && !notice[theWeek[0]][db].last30){
							for(let boss of dayBosses[db]){
								const embed = embedContent(boss,db,diff,0x62FF00);
								channel.send({embeds:[embed]});
							}
							if(totalGuilds == idx) notice[theWeek[0]][db].last30 = true;
							
							bot.user.setActivity("• " + db + " - "+dayBosses[db].join('/')+" •", {type: "WATCHING"});
							sendMentions = true;
							
						}
						if(diff < 900000 && diff > 0 && !notice[theWeek[0]][db].last15){
							for(let boss of dayBosses[db]){
								const embed = embedContent(boss,db,diff,0xFF8100);
								channel.send({embeds:[embed]});
							}
							if(totalGuilds == idx) notice[theWeek[0]][db].last15 = true;
							sendMentions = true;
						}
						if(diff < 300000 && diff > 0 && !notice[theWeek[0]][db].last5){
							for(let boss of dayBosses[db]){
								const embed = embedContent(boss,db,diff,0xFF0000);
								channel.send({embeds:[embed]});
							}
							if(totalGuilds == idx) notice[theWeek[0]][db].last5 = true;
							sendMentions = true;
						}
						if(diff <= 0 && !notice[theWeek[0]][db].visible && notice[theWeek[0]][db].last30 && notice[theWeek[0]][db].last15 && notice[theWeek[0]][db].last5){
							for(let boss of dayBosses[db]){
								const embed = embedContent(boss,db,diff,0x000000);
								channel.send({embeds:[embed]});
							}
							if(totalGuilds == idx) notice[theWeek[0]][db].visible = true;
							sendMentions = true;
						}
					}
				}
			}
				
			if(sendMentions && role)
				channel.send({content:role.toString()});
			
			if(totalGuilds == idx && sendMentions) 
				fs.writeFileSync(path.join(__dirname,'session.json'), JSON.stringify(notice));
		}
	}
  },5000);
});

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = bot.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

function embedContent(boss,time,diff,color){
	let leftTime = (diff <= 0)?"已經出現囉":"還剩下 " + Math.round(diff/1000/60) +" 分鐘";
	
	let timeHours = ((time.split(":")[0]).length == 1)?"0"+time.split(":")[0]:time.split(":")[0];
	let timeMinutes = time.split(":")[1];
	let description = (config.bossInfo[boss].description).replace('%time',`${timeHours}:${timeMinutes}`);
	
	const embed = new MessageEmbed()
		 .setTitle(config.bossInfo[boss].fullname)
		 .setDescription(description)
		 .setColor(color)
		 .setThumbnail(config.bossInfo[boss].avatar)
		 .addField("剩餘時間", leftTime)
		 .addField("位於", config.bossInfo[boss].locate)
		 .addField("掉落物", config.bossInfo[boss].loot.join("\n"))
		 .setFooter({
			text: bot.user.username,
			iconURL: bot.user.avatarURL()
		 })
		 .setTimestamp();
	return embed;
}

function initializationObj(lastSess,turnDay){
	console.log("before",notice);
	
	if(lastSess){
		console.log("Loaded last session");
		// 載入上次的工作階段
		notice = lastSess;
	}
	else{
		console.log("Changed the week");
		// 換日
		let nowdate = new Date().getDay();
		let nextWeek = (nowdate+1==7)?0:nowdate+1;
		let tempObj = notice[nowdate];
		
		let bosses = config.bosses;
		
		notice = new Object();
		
		for(let b in bosses){
			if(b != nextWeek) continue;
			
			notice[nextWeek] = new Object();
			let dayBosses = bosses[nextWeek];
			for(let db in dayBosses){
				if(!notice[nextWeek][db]) notice[nextWeek][db] = new Object();
				
				notice[nextWeek][db] = {
					last30: false,
					last15: false,
					last5: false,
					visible: false
				}
			}
		}
		
		notice[nowdate] = tempObj;
	}
	
	console.log("after",notice);
	fs.writeFileSync(path.join(__dirname,'session.json'), JSON.stringify(notice)); 
	console.log("== DONE ==");
}

function checkPerms(channel,guild){
	if(
		guild.me.permissionsIn(channel).has(Permissions.FLAGS.EMBED_LINKS) &&
		guild.me.permissionsIn(channel).has(Permissions.FLAGS.VIEW_CHANNEL) &&
		guild.me.permissionsIn(channel).has(Permissions.FLAGS.SEND_MESSAGES) &&
		guild.me.permissionsIn(channel).has(Permissions.FLAGS.SEND_MESSAGES_IN_THREADS)
		)
		return true;
	else
		return false;
}

bot.login(config.token);