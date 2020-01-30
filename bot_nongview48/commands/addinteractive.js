/* Dependencies */
const _ = require('lodash');
const async = require('async');

module.exports = {
    name: 'addinteractive',
    description: '',
    permit: ['Admin','Developer','Moderator'],
    execute(client, message, args) {
        async.waterfall([
            function (callback) {
                message.reply("คำถามที่จะให้น้องหลาวตอบ ?").then(function () {
                    message.channel.awaitMessages(m => m.author.id === message.author.id, { 
                        max: 1,
                        time: 60000,
                        errors: ['time'] 
                    }).then((collected) => {
                        let message = collected.first().content.toLowerCase();
                        
                        if(message == "cancel") {
                            return callback('cancel');
                        }

                        let db = global.lowsession.get("default_message").find({ text : message }).value()
                        if(db) {
                            return callback('มีข้อความนี้อยู่แล้ว');
                        }
                        
                        return callback(null, { 
                            Question: {
                                text: message
                            }
                        });
                    }).catch(function (err) {
                        console.log(err);
                        return callback('cancel');
                    });
                });
            },
            function(data, callback) {
                message.reply("คำตอบจะให้น้องหลาวตอบ ?").then(function () {
                    message.channel.awaitMessages(m => m.author.id === message.author.id, { 
                        max: 1,
                        time: 60000,
                        errors: ['time'] 
                    }).then((collected) => {
                        let message = collected.first().content.toLowerCase();
                        
                        if(message == "cancel") {
                            return callback('cancel');
                        }

                        let attachments = collected.first().attachments.array();
                        let data_attachments = [];
                        async.each(attachments, function(attachment, cb) {
                            data_attachments.push(attachment.url);
                
                            cb();
                        }, function () {
                            data.Answer = {
                                text: message,
                                attachments: data_attachments
                            };
                            return callback(null, data);
                        })
                    }).catch(function (err) {
                        console.log(err);
                        return callback('cancel');
                    });
                });
            },
        ], function (err, result) {
            if(err) {
                return message.reply(err);
            }

            global.lowsession.get("default_message").push({ question_text : result.Question.text, answer_text: result.Answer.text, answer_attachments: result.Answer.attachments }).write();
            if(result.Answer.attachments > 0) {
                message.reply("บันทึก\n คำถาม : " + result.Question.text + " คำตอบ : " + result.Answer.text + " ลงไปในฐานข้อมูลแล้ว", {
                    files: result.Answer.attachments
                })
            } else {
                message.reply("บันทึก\n คำถาม : " + result.Question.text + " คำตอบ : " + result.Answer.text + " ลงไปในฐานข้อมูลแล้ว");
            }
        });
    }
}