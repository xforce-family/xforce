/* Dependencies */
const _ = require('lodash');
const async = require('async');

module.exports = {
    name: 'addmsg',
    description: '',
    permit: ['Admin','Developer','Moderator'],
    execute(client, message, args) {
        let message_type = args[1];

        args.shift();
        _.pull(args, message_type); // <- This is "duration" data

        /* Process Command */
        let attachments = message.attachments.array();
        let custom_message = "";

        if (args.length > 0) {
            custom_message = args.join(' ');
        }

        let dbtable;
        if(message_type == "noperm") {
            dbtable = "nopermission_message"
        } else if(message_type == "mute") {
            dbtable = "mute_message"
        } else if(message_type == "help") {
            dbtable = "help_message"
        } else if(message_type == "blackhole") {
            dbtable = "blackhole_message"
        } else {
            return message.reply("ไม่เจอข้อความ Type นี้")
        }
    
        let data_attachments = [];
        async.each(attachments, function(attachment, cb) {
            data_attachments.push(attachment.url);

            cb();
        }, function () {
            let db = global.lowsession.get(dbtable).find({ text : custom_message, attachments: data_attachments }).value()
            if(db) {
                return message.reply('มีข้อความนี้อยู่ใน Type นี้อยู่แล้ว');
            }
    
            global.lowsession.get(dbtable).push({ text : custom_message, attachments: data_attachments }).write();
            if(data_attachments.length > 0) {
                if(custom_message.length == 0) {
                    message.reply("บันทึกรูปลงไปในฐานข้อมูล" + dbtable + "แล้ว", {
                        files: data_attachments
                    })
                } else {
                    message.reply("บันทึกข้อความ '" +custom_message + "' และรูปลงไปในฐานข้อมูล " + dbtable + " แล้ว", {
                        files: data_attachments
                    })
                }
            } else {
                message.reply("บันทึกข้อความ '" +custom_message + "' ลงไปในฐานข้อมูล " + dbtable + " แล้ว");
            }
        })
    }
}