/* Helpers */
const _ = require('lodash');
const { logInfo, logOk, logWarn, logError } = require('../helpers/logger');

/* Function */
function Random_Message(db_table, cb = null) {
    if (!db_table) { 
        if(cb != null) { return cb(); };
    };

    let arr = global.lowsession.get(db_table).value();
    let random = arr[_.random(arr.length-1)];

    if(cb != null) {
        return cb(random);
    }
}

module.exports = {
    name: 'mute',
    description: 'ใบ้จ้า',
    execute(client, message, args) {
        if (!message.member.roles.find(role => role.name === 'Admin') && !message.member.roles.find(role => role.name === 'Developer') && !message.member.roles.find(role => role.name === 'Moderator')) { 
            Random_Message("nopermission_message", (randomed_msg) => {
                if(randomed_msg) { message.reply(randomed_msg); };
            });

            return;
        }

        
    }
};