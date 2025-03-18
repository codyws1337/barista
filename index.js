const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, PermissionsBitField, MessageFlags } = require('discord.js');
const axios = require('axios');
const nlp = require('compromise');
const { saveKnowledge, getKnowledge } = require('./functions/database');
const { token, HUGGINGFACE_API_KEY } = require('./config.json');
const {Linksembed} = require('./functions/embeds');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Hugging Face API setup
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
const HEADERS = { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` };

function detectIntent(message) {
    const doc = nlp(message);

    // Extract meaningful words (nouns, verbs) from the sentence
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');

    // Twitch-related intent (must be related to streaming)
    if ( message.includes('twitch') && (verbs.includes('watch'))) {
        return 'twitch';
    }

    // YouTube-related intent
    if (nouns.includes('youtube') || (verbs.includes('watch') && message.includes('youtube'))) {
        return 'youtube';
    }

    // Discord-related intent
    if (nouns.includes('discord') || (verbs.includes('join') && message.includes('discord'))) {
        return 'discord';
    }

    // Merch-related intent
    if (nouns.includes('merch') || nouns.includes('store') || nouns.includes('shop')) {
        return 'merch';
    }

    return null; // No recognized intent
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const userInput = message.content.toLowerCase();
    const isMentioned = message.mentions.has(client.user);
    const isAdmin = message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

    // Determine intent
    const intent = detectIntent(userInput);

    if (intent) {
        const response = getKnowledge(intent);
        if (response) {
            return message.reply({ embeds: [Linksembed] });
        }
    }
    if (!isMentioned) return;

    // If no intent is found, fall back to AI-generated responses
    try {
        const response = await axios.post(HUGGINGFACE_API_URL, { inputs: userInput }, { headers: HEADERS });
        const aiResponse = response.data.generated_text || "I'm not sure how to respond to that.";
        await message.reply(aiResponse);
    } catch (error) {
        console.error("Hugging Face API Error:", error);
        await message.reply("I'm having trouble thinking right now.");
    }
});

// === COMMAND HANDLING SYSTEM ===
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


// === EVENT HANDLING SYSTEM ===
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// === START BOT ===
client.login(token);
