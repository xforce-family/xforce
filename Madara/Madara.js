/* Dependencies */
const Discord = require('discord.js');

/* Client */
const client = new Discord.Client({autoReconnect:true});

/* Helpers */
const { logInfo, logOk, logWarn, logError } = require('./helpers/logger');

/* Variable */
const { Bai, token, xforce_guild_id } = require("./config.json");

/* Event */
client.on('ready', () => {
    logOk(`Logged in as ${client.user.tag}!`, 'Discord');
    global.xforce_guild = client.guilds.get(xforce_guild_id);
});

client.on('MadaraReactionAdd', (reaction, user) => {
    if(!reaction) { return };
    if(reaction._emoji.id !== "446705009707450368") { return };

    setImmediate(() => {
        if(reaction.count == Bai) {
            reaction.message.react("446705009707450368");
            

            logOk("Message ID : " + reaction.message.id + " | Baimun Count : " + reaction.count + " (Triggered)", "ReactionAdd")
        } else {
            logInfo("Message ID : " + reaction.message.id + " | Baimun Count : " + reaction.count, "ReactionAdd");
        }
    })
});

/* 
    https://stackoverflow.com/questions/53093266/why-messagereactionadd-do-nothing-discord-js
    https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md 
*/
client.on('raw', packet => {
    if (!['MESSAGE_REACTION_ADD'].includes(packet.t)) return;
    // Grab the channel to check the message from
    setImmediate(() => {
        const channel = client.channels.get(packet.d.channel_id);
        // Since we have confirmed the message is not cached, let's fetch it
        channel.fetchMessage(packet.d.message_id).then(message => {
            // Emojis can have identifiers of name:id format, so we have to account for that case as well
            const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
            // This gives us the reaction we need to emit the event properly, in top of the message object
            const reaction = message.reactions.get(emoji);
            // Adds the currently reacting user to the reaction's users collection.
            if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
            // Check which type of event it is before emitting
            if (packet.t === 'MESSAGE_REACTION_ADD') {
                client.emit('MadaraReactionAdd', reaction, client.users.get(packet.d.user_id));
            }
        });
    });
});

/* Init */
client.login(token);