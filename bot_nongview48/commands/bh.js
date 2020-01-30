/* This is copy & pased from mute.js */

/* Dependencies */
const ms = require('ms');
const _ = require('lodash');
const async = require('async');
const moment = require('moment');

/* Function */
function Process(channels, mentions, args, cb = null) {
    // We created table for contain processed data
    let Data = {
        'Channels': [],
        'Users': []
    };

    // We're gonna process the channel data first
    async.each(channels, function(channel, callback) {
        let channel_id = channel.id;
        
        //Push the id into list that we will announce about mute
        Data.Channels.push(channel_id);

        //And Exclude it
        _.pull(args, "<#" + channel_id + ">");

        // Next
        callback();
    }, function(err) {
        // Next, We gonna process the client data
        async.each(mentions, function(mention, callback) {
            let member_id = mention.id;

            //Push the info into list that we will mute
            Data.Users.push({id: member_id});

            //And Exclude it
            _.pull(args, "<@!" + member_id + ">");

            // Next
            callback();
        }, function(err) {
            if(cb != null) {
                return cb(Data);
            }
        });
    });
}

function Performing_Blackhole(data, client, message) {
    let Users = data.Users;
    let Channels = data.Channels;
    let Message = data.Message;
    let Converted_Duration = ms(data.Duration);

    let Summary_Array = [];

    async.each(Users, function(user, callback) {
        let db_get = global.lowsession.get('blackholed').find({ id: user.id }).value();

        if(!db_get) {
            let user_data = global.xforce_guild.members.get(user.id);
            user_data.addRole(global.blackhole_role);
            Summary_Array.push("<@" + user.id + ">");

            user.expired = moment().add(Converted_Duration, 'milliseconds');
            user.channels = Channels;
            global.lowsession.get('blackholed').push(user).write();
        }

        callback();
    }, function(err) {
        if (Summary_Array.length <= 0) { return };

        let announce_message = "";
        if (Summary_Array.length > 0) {
            announce_message += "Users " + Summary_Array.join(', ') + " ถูก " + "<@&" + global.blackhole_role + ">";
        }

        announce_message += " เป็นเวลา " + ms(Converted_Duration, { long: true });

        async.each(Channels, function(channel, callback) {
            client.channels.get(channel).send(announce_message).then(msg => {
                if(Message.attachments.length > 0) {
                    if(Message.length == 0) {
                        msg.channel.send({
                            files: Data.Message.attachments
                        })
                    } else {
                        msg.channel.send(Message.text, {
                            files: Data.Message.attachments
                        })
                    }
                } else {
                    msg.channel.send(Message.text);
                }
            })

            callback();
        });
    });
}

module.exports = {
    name: 'bh',
    description: '',
    permit: ['Admin','Developer','Moderator'],
    execute(client, message, args) {
        /* Map some data that not need to process */
        let duration = args[1];

        /* Exclude some data that not need to process */
        args.shift(); // <- This is "bh" command
        _.pull(args, duration); // <- This is "duration" data

        /* Process Data */
        
        // Map all data that need to process
        let channels = message.mentions.channels.array();
        let mentions = message.mentions.users.array();

        //If channel is not mentioned. We assume current channel as a channel.
        if (channels.length <= 0) {
            channels = [];
            channels.push(message.channel);
        }

        // Then process the data
        Process(channels, mentions, args, (Data) => {
            //Set more data
            Data.Duration = duration;

            //Free some memory
            delete mentions;
            delete duration;

            //Final one is args. We'll see if args is empty, Means we'll random some mute message. If not, we'll take it as custom message.
            //We forgot one thing. Image. So we'll see if message has an image. we'll take it as custom message too.
            let attachments = message.attachments.array();
            
            if(args.length <= 0 && attachments.length <= 0) {
                global.Random_Message("blackhole_message", (randomed_msg) => {
                    if(randomed_msg) { Data.Message = randomed_msg };

                    Performing_Blackhole(Data, client, message);
                });    
            } else {
                Data.Message = [];
                Data.Message.attachments = [];
                async.each(attachments, function(attachment, callback) {
                    Data.Message.attachments.push(attachment.url);

                    callback();
                }, function(err) {
                    if (args.length <= 0) {
                        Data.Message.text = "";
                    } else {
                        Data.Message.text = args.join(' ');
                    }

                    Performing_Blackhole(Data, client, message);
                    delete attachment_array;
                })
            }
        });
    }
};