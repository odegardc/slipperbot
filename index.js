// Bot Token
require('dotenv').config();
const botToken = process.env.TOKEN;

const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

const { parseSlippyTime, updateSlippyDB } = require('./utils/functions.js');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
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

// Slippy spotter
let previousMessageIsMention = false;
const slippyId = '439872133078712323';
const slippyPromises = new Map();

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if ((message.author.id === slippyId) && previousMessageIsMention) {
        previousMessageIsMention = false;

        // Check if message is a time
        const paresedMessage = parseSlippyTime(message.content, message.createdTimestamp);

        // Response based off slippy time type
        if (paresedMessage) {
            switch (paresedMessage.type) {
                case "vague":
                    console.log("Found Vague Slippy Time", paresedMessage.phrase);
                    slippyPromises.set(slippyId, {
                        timestamp: Date.now(),
                        slippyTime: paresedMessage
                    });
                    return;
                case "absolute":
                    console.log("Found Absolute Slippy Time", paresedMessage.hour, paresedMessage.minute);
                    slippyPromises.set(slippyId, {
                        timestamp: Date.now(),
                        slippyTime: paresedMessage
                    });
                    return;
                case "relative":
                    console.log("Found Relative Slippy Time", paresedMessage.number, paresedMessage.unit);
                    slippyPromises.set(slippyId, {
                        timestamp: Date.now(),
                        slippyTime: paresedMessage
                    });
                    return;
            }
        }
        // Checks if previous message was an @mention to reduce false slippy time flags    
    } else if ((message.mentions.users.size > 0 || message.mentions.roles.size > 0)) {
        previousMessageIsMention = true;
        console.log("Previous message is mention?", previousMessageIsMention);
    }
    return;
});

// Check if/when slippy joins call
client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.member?.id === slippyId && !oldState.channelId && newState.channelId) {
        const tracked = slippyPromises.get(slippyId);
        if (!tracked) return;

        const now = Date.now();
        const deltaMinutes = Math.round((now - tracked.timestamp) / 60000);

        const slippyTimeWithDelta = {
            ...tracked.slippyTime,
            actualDeltaMinutes: deltaMinutes,
            failed: false
        };

        updateSlippyDB(slippyTimeWithDelta)
            .then(res => console.log("Logged to DB:", res))
            .catch(err => console.error("Failed to update DB:", err));

        // Update slippy Promises
        slippyPromises.set(slippyId, { ...tracked, joined: true });
    }
});


// Run at midnight to log failed slippy promise
function scheduleMidnightCheck() {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5) - now;
    setTimeout(() => {
        checkSlippyFailures();
        // schedule the next check
        scheduleMidnightCheck();
    }, msUntilMidnight);
}

function checkSlippyFailures() {
    const tracked = slippyPromises.get(slippyId);
    if (tracked && !tracked.joined) {
        console.log("Slippy failed promise.");
        const failedEntry = {
            ...tracked.slippyTime,
            actualDeltaMinutes: null,
            failed: true
        };
        updateSlippyDB(failedEntry)
            .then(res => console.log("Logged failed promise:", res))
            .catch(err => console.error("Failed to log failed promise:", err));
    }
    // clear daily
    slippyPromises.delete(slippyId);
}

// On start
client.once("clientReady", () => {
    console.log(`Logged in as: ${client.user.tag}`);
    scheduleMidnightCheck();
});

client.login(botToken);