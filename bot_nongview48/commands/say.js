/* Dependencies */
const _ = require('lodash');
const async = require('async');

/* Function */
function Say(Data, client, message) {
    async.each(Data.Channels, function(channel, callback) {
        let msg_channel = client.channels.get(channel)
        
        if (Data.Attachments.length > 0) {
            if(Data.Message.length == 0) {
                msg_channel.send({
                    files: Data.Attachments
                })
            } else {
                msg_channel.send(Data.Message, {
                    files: Data.Attachments
                })
            }
        } else {
            msg_channel.send(Data.Message);
        }

        callback();
    }, function() {
        delete Data;
    });
}

module.exports = {
    name: 'say',
    description: '',
    permit: ['Admin','Developer','Moderator'],
    execute(client, message, args) {
        /* Exclude some data that not need to process */
        args.shift();

        /* Process Command */

        // Map all data that need to process
        let channels = message.mentions.channels.array();
        let attachments = message.attachments.array();
        
        //If channel is not mentioned. We assume current channel as a channel.
        if (channels.length <= 0) {
            channels = [];
            channels.push(message.channel);
        }

        let Data = {
            Channels: [],
            Attachments: []
        };

        async.each(attachments, function(attachment, callback) {
            Data.Attachments.push(attachment.url);

            callback();
        }, function(err) {
            async.each(channels, function(channel, callback) {
                let channel_id = channel.id;
                
                //Push the id into list that we will announce about mute
                Data.Channels.push(channel_id);

                //And Exclude it
                _.pull(args, "<#" + channel_id + ">");
        
                // Next
                callback();
            }, function(err) {
                if (args.length <= 0) {
                    Data.Message = "";
                } else {
                    Data.Message = args.join(' ');
                }

                Say(Data, client, message);
            });
        });
    }
}