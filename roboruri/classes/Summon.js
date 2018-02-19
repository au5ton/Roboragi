// Summon.js

class Summon {
    constructor(type, query, bot_instance, data) {
         /*
            inline summon:
            {
                type: 'inline',
                from_id: 123123123,
                query_id: 123123123,
                query: 'toradora',
                bot_instance: [object]

            }
            call summon:
            {
                type: 'call',
                query: 'toradora',
                chat_id: 123123123,
                reply_to_message_id: 123123123,
                bot_instance: [object]
            }
        */
        this.type = type;
        this.query = query;
        this.bot_instance = bot_instance;
        if(type === 'inline') {
            this.from_id = data.from_id;
            this.query_id = data.query_id;
        }
        if(type === 'call') {
            this.chat_id = data.chat_id;
            this.reply_to_message_id = data.reply_to_message_id;
        }
    }
}

module.exports = Summon
