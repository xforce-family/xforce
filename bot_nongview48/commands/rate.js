/* This Source is old one from Nongview v.1 */

/* Dependencies */
const moment = require("moment");

module.exports = {
    name: 'rate',
    description: '',
    permit: [],
    execute(client, message, args) {
        message.channel.fetchMessages({ limit: 100 }).then(messages => {
            let messagearr = [];
            messages.forEach((msg) => {
                messagearr.push(msg.createdTimestamp);
            })  
            
            let firsttime = moment(messagearr[0]);
            let messagecount = messagearr.length;
            let lasttime = moment(messagearr[messagecount - 1]);
        
            let diff = firsttime.diff(lasttime, "seconds");
            let average = diff / messagecount;
            message.channel.send(`อัตราการส่งข้อความในแนลนี้ : **1 ข้อความทุกๆ ${average} วินาที**, โดยวัดจาก 100 ข้อความก่อนหน้านี้`)
        });
    }
}