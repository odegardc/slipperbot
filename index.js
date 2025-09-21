// Bot Token
require('dotenv').config();
const botToken = process.env.TOKEN;

const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

const { parseSlippyTime } = require('./utils/functions.js');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Command Loader
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Interaction Handeler 
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
		}
	}
    console.log(interaction);
});

client.once("clientReady", () => {
    console.log(`Logged in as: ${client.user.tag}`);
});

// Slippy spotter
let previousMessageIsMention = false;
const slippyId = '439872133078712323';

client.on("messageCreate", async (message) => {
    if(message.author.bot) return;

    if ((message.author.id === slippyId) && previousMessageIsMention) {
        previousMessageIsMention = false;
        
        // Check if message is a time
        const paresedMessage = parseSlippyTime(message.content);

        // Response based off slippy time type
        if(paresedMessage){
            switch(paresedMessage.type){
                case "vague":
                    message.reply("WORKED!!!");
                    return;
            }
        }
    } else if((message.mentions.users.size > 0 || message.mentions.roles.size > 0)){
        previousMessageIsMention = true;
        console.log("Previous message is mention?", previousMessageIsMention);
    }
    return;
});


client.login(botToken);