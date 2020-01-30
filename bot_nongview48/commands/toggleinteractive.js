module.exports = {
    name: 'toggleinteractive',
    description: '',
    permit: ['Admin','Developer','Moderator'],
    execute(client, message, args) {
        global.interactive = !global.interactive;
        global.lowsession.set('interactive', global.interactive).write()

        let msg = 'การโต้ตอบของน้องหลาวตอนนี้ถูก';
        msg += global.interactive == false ? 'ปิด' : 'เปิด';
        message.reply(msg);
    }
}