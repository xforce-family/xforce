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
        'Users': [],
        'Duration': ""
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
            let member_data = global.xforce_guild.members.get(member_id);
            let Moderator = !!member_data.roles.find(role => role.name === 'Moderator')

            //Push the info into list that we will mute
            Data.Users.push({id: member_id, isModerator: Moderator});

            //And Exclude it
            _.pull(args, "<@!" + member_id + ">");

            // Next
            callback();
        }, function(err) {
            Data.Duration = args[0] || "5m";
            
            if(cb != null) {
                return cb(Data);
            }
        });
    });
}

function Performing_Mute(data, client, message) {
    let Users = data.Users;
    let Channels = data.Channels;
    let Message = data.Message;
    let Converted_Duration = ms(data.Duration);

    let Summary_Array = {
        Normal: [],
        Moderator: []
    };

    async.each(Users, function(user, callback) {
        let db_get = global.lowsession.get('muted').find({ id: user.id }).value();

        if(!db_get) {
            let user_data = global.xforce_guild.members.get(user.id);

            if(user.isModerator) {
                user_data.addRole(global.moderator_mute_role);

                Summary_Array.Moderator.push("<@" + user.id + ">");
            } else {
                user_data.addRole(global.default_mute_role);

                Summary_Array.Normal.push("<@" + user.id + ">");
            }

            user.expired = moment().add(Converted_Duration, 'milliseconds');
            user.channels = Channels;
            global.lowsession.get('muted').push(user).write();
        }

        callback();
    }, function(err) {
        if (Summary_Array.Normal.length <= 0 && Summary_Array.Moderator.length <= 0) { return };

        let announce_message = "";
        if (Summary_Array.Normal.length > 0) {
            announce_message += "Users " + Summary_Array.Normal.join(', ') + " ถูก " + "<@&" + global.default_mute_role + ">";
        }

        if (Summary_Array.Moderator.length > 0) {
            if(announce_message !== "") {
                announce_message += "และ";
            }

            announce_message += "Users " + Summary_Array.Moderator.join(', ') + " ถูก " + "<@&" + global.moderator_mute_role + ">"
        }

        announce_message += " เป็นเวลา " + ms(Converted_Duration, { long: true });

        async.each(Channels, function(channel, callback) {
            client.channels.get(channel).send(announce_message).then(msg => {
                if(Message.attachments.length > 0) {
                    if(Message.text.length == 0) {
                        msg.channel.send({
                            files: Message.attachments
                        })
                    } else {
                        msg.channel.send(Message.text, {
                            files: Message.attachments
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
    name: 'mute',
    description: 'ใบ้จ้า',
    permit: ['Admin','Developer','Moderator'],
    execute(client, message, args) {

        /* Exclude some data that not need to process */
        args.shift(); // <- This is "mute" command

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
            _.pull(args, Data.Duration); // <- This is "duration" data
          
            //Free some memory
            delete mentions;
            delete duration;

            //Final one is args. We'll see if args is empty, Means we'll random some mute message. If not, we'll take it as custom message.
            //We forgot one thing. Image. So we'll see if message has an image. we'll take it as custom message too.
            let attachments = message.attachments.array();

            if(args.length <= 0 && attachments.length <= 0) {
                global.Random_Message("mute_message", (randomed_msg) => {
                    if(randomed_msg) { Data.Message = randomed_msg };

                    Performing_Mute(Data, client, message);
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

                    Performing_Mute(Data, client, message);
                    delete attachment_array;
                })
            }
        });
    }
};