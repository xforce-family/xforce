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
    default_message: [],
    muted: [],
    interactive: false
}).write();

/* Globals */
global.lowsession = db;
global.xforce_guild = null;
global.default_mute_role = "433462069702950923";
global.moderator_mute_role = "478921501442179092";
global.interactive = false;
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
function checkPermission(message, permit, cb) {
    if (permit.length == 0) {
        return cb(true);
    }

    if(message.member.roles.some(r=>permit.includes(r.name)) ) {
        return cb(true);
    } else {
        return cb(false);
    }
}

function SendRandomNoPermissionMessage(message) {
    global.Random_Message("nopermission_message", (randomed_msg) => {
        if(randomed_msg) { 
            if (randomed_msg.attachments.length > 0) {
                if(randomed_msg.text.length == 0) {
                    message.reply({
                        files: randomed_msg.attachments
                    })
                } else {
                    message.reply(randomed_msg.text, {
                        files: randomed_msg.attachments
                    })
                }
            } else {
                message.reply(randomed_msg.text);
            }
        };
    });
}


/* Event */
client.on('ready', () => {
    logOk(`Logged in as ${client.user.tag}!`, 'Discord');
    global.xforce_guild = client.guilds.get(xforce_guild_id);
    global.interactive = db.get('interactive').value();

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
    if (message.author.bot) { return };
    if (message.author.id !== "405397046691102740") { return; } // NOTE : REMOVE THIS WHEN PRODUCTION
    if (!message.content.startsWith(prefix)) {
        if(global.interactive) {
            let db_get = global.lowsession.get("default_message").find({ question_text: message.content }).value();
            if(db_get) {
                if (db_get.answer_attachments.length > 0) {
                    if(db_get.answer_text.length == 0) {
                        message.channel.send({
                            files: db_get.answer_attachments
                        })
                    } else {
                        message.channel.send(db_get.answer_text, {
                            files: db_get.answer_attachments
                        })
                    }
                } else {
                    message.channel.send(db_get.answer_text);
                }
            }
        }

        return;
    }

    const args = message.content.slice(prefix.length).split(/ +/);
    args.shift()
    const command = args[0].toLowerCase();

    if (!client.commands.has(command)) { return; }

    try {
        let command_data = client.commands.get(command)

        checkPermission(message, command_data.permit, (allow) => {
            if(allow) {
                client.commands.get(command).execute(client, message, args);
            } else {
                SendRandomNoPermissionMessage(message);
            }
        })
    } catch (error) {
        logError(error, 'CommandHandler');
        message.reply('เออเร่อ... ติดต่อน้องโม่ยให้หน่อยยยย');
    }
});

/* Init */
client.login(token);