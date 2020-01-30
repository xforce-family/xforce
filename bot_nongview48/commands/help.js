module.exports = {
    name: 'ช่วยด้วย',
    description: '',
    permit: [],
    execute(client, message, args) {
        global.Random_Message("help_message", (randomed_msg) => {
            if(randomed_msg) { 
                if (randomed_msg.attachments.length > 0) {
                    if(randomed_msg.text.length == 0) {
                        message.channel.send({
                            files: randomed_msg.attachments
                        })
                    } else {
                        message.channel.send(randomed_msg.text, {
                            files: randomed_msg.attachments
                        })
                    }
                } else {
                    message.channel.send(randomed_msg.text);
                }
            };
        });
    }
}