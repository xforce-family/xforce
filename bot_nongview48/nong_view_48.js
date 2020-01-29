/* Dependencies */
const fs = require('fs');
const _ = require('lodash');
const low = require('lowdb');
const async = require('async');
const moment = require('moment');
const Discord = require('discord.js');

/* Client */
const client = new Discord.Client();

/* Helpers */
const { logInfo, logOk, logWarn, logError } = require('./helpers/logger');

/* Variable */
const { prefix, token, xforce_guild_id } = require("./config.json");

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
    mute_message: [],
    muted: []
}).write();

/* Globals */
global.lowsession = db;
global.xforce_guild = null;
global.default_mute_role = "433462069702950923"
global.moderator_mute_role = "478921501442179092"
global.Random_Message = function(db_table, cb = null) {
    if (!db_table) { 
        if(cb != null) { return cb(); };
    };

    let arr = global.lowsession.get(db_table).value();
    let random = arr[_.random(arr.length-1)];

    if(cb != null) {
        return cb(random);
    }
}

/* Function */

/* Event */
client.on('ready', () => {
    logOk(`Logged in as ${client.user.tag}!`, 'Discord');
    global.xforce_guild = client.guilds.get(xforce_guild_id);

    client.setInterval(() => {
        let Muted_Data = db.get('muted').value()
        let now = moment();

        async.each(Muted_Data, function(data, callback) {
            let expired = moment(data.expired);
            let diff = now.diff(moment(expired));

            if(diff < 0) {
                return callback();
            }

            let user_id = data.id;
            let user_isModerator = data.isModerator;
            let user_data = global.xforce_guild.members.get(user_id);
            
            if(user_isModerator) {
                let Muted_Role = !!user_data.roles.find(role => role.name === 'ใบ้หัวแดง')
                
                if(Muted_Role) {
                    user_data.removeRole(global.moderator_mute_role);

                    async.each(data.channels, function(channel, cb) {
                        client.channels.get(channel).send("User <@" + user_id + "> หลุดพ้นจากการ " + "<@&" + global.moderator_mute_role + ">");

                        cb();
                    });
                }
            } else {
                let Muted_Role = !!user_data.roles.find(role => role.name === 'ใบ้แดก')

                if(Muted_Role) {
                    user_data.removeRole(global.default_mute_role);

                    async.each(data.channels, function(channel, cb) {
                        client.channels.get(channel).send("User <@" + user_id + "> หลุดพ้นจากการ " + "<@&" + global.default_mute_role + ">");

                        cb();
                    });
                }
            }

            db.get('muted').remove({ id: user_id }).write()
            callback();
        });
    }, 1000)
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) { return; }
    if (message.author.id !== "405397046691102740") { return; } // NOTE : REMOVE THIS WHEN PRODUCTION

    const args = message.content.slice(prefix.length).split(/ +/);
    
    args.shift()
    const command = args[0].toLowerCase();

    if (!client.commands.has(command)) { return; }

    try {
        client.commands.get(command).execute(client, message, args);
    } catch (error) {
        logError(error, 'CommandHandler');
        message.reply('เออเร่อ... ติดต่อน้องโม่ยให้หน่อยยยย');
    }
});

/* Init */
client.login(token);