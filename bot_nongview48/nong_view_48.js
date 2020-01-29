/* Dependencies */
const fs = require('fs');
const low = require('lowdb');
const Discord = require('discord.js');

/* Client */
const client = new Discord.Client();

/* Helpers */
const { logInfo, logOk, logWarn, logError } = require('./helpers/logger');

/* Variable */
const { prefix, token } = require("./config.json");

/* Commands Loader */
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
    logOk(`Loaded ${file}`, 'CommandLoader')
}

/* Lowdb */
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter);
db.defaults({ 
    nopermission_message: [], 
    mute_message: [] 
}).write();

/* Globals */
global.lowsession = db;

/* Event */
client.on('ready', () => {
    logOk(`Logged in as ${client.user.tag}!`, 'Discord');
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) { return; }
    if (message.author.id !== "405397046691102740") { return; } // NOTE : REMOVE THIS WHEN PRODUCTION

    const args = message.content.slice(prefix.length).split(/ +/);
    
    args.shift()
    const command = args[0].toLowerCase();

    if (!client.commands.has(command)) { return; }

    try {
        client.commands.get(command).execute(client, message, args, db);
    } catch (error) {
        logError(error, 'CommandHandler');
        message.reply('เออเร่อ... ติดต่อน้องโม่ยให้หน่อยยยย');
    }
});

/* Init */
client.login(token);