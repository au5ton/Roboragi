//summon_resolver.js

//import stuffs
const logger = require('au5ton-logger');
const Searcher = require('./searcher');
const bot_util = require('./bot_util');

const _ = {};

/*

each should accept:
- a Summon object

*/

// step 2: do some middleware whatevers to the anime object with some provided context
//      such as: https://github.com/au5ton/Roboruri/issues/48
_.processMessageBeforeMessageGeneration = (summon, anime) => {
    //return new Promise((resolve, reject) => {});
};

// step 3: actually send the fucking response in the appropriate way (also some other middleware whatevers if you already generated the message text, maybe)
_.deliverMessage = (summon, anime) => {
    //shouldn't need a promise
};

// step 1: take summon data and get the correct anime object in the appropriate means
_.resolveBrace = (summon) => {

    let query = summon.query;
    let chat_id = summon.chat_id;
    let bot = summon.bot_instance;

    logger.log('Summon: {', summon.query, '}');
    console.time('execution time');

    Searcher.matchFromCache('{'+query+'}').then((result) => {
        //boo yah
        logger.log('hi');
        bot.telegram.sendMessage(chat_id, bot_util.buildAnimeChatMessage(result), {
            parse_mode: 'html',
            disable_web_page_preview: result['image'].startsWith('http') ? false : true,
            reply_to_message_id: summon.reply_to_message_id
        });
        console.timeEnd('execution time');
    }).catch((err) => {
        logger.warn('cache empty: ', err);
        //nothing in cache
        Searcher.matchAnimeFromDatabase(query).then((result) => {
            //boo yah
            bot.telegram.sendMessage(chat_id, bot_util.buildAnimeChatMessage(result), {
                parse_mode: 'html',
                disable_web_page_preview: result['image'].startsWith('http') ? false : true,
                reply_to_message_id: summon.reply_to_message_id
            });
            console.timeEnd('execution time');
        }).catch((err) => {
            logger.warn('database empty: ', err);
            //nothing in database
            Searcher.searchAnimes(query).then((result) => {
                bot.telegram.sendMessage(chat_id, bot_util.buildAnimeChatMessage(result), {
                    parse_mode: 'html',
                    disable_web_page_preview: result['image'].startsWith('http') ? false : true,
                    reply_to_message_id: summon.reply_to_message_id
                });
                console.timeEnd('execution time');
            }).catch((r) => {
                //well that sucks
                if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
                    logger.warn('q: {'+query+'} => '+filled_x)
                }
                else {
                    logger.error('failed to search with Searcher: ', r);
                }
                console.timeEnd('execution time');
            });
        });
    });
};

_.resolveLTGT = (summon) => {
    //
};

_.resolveReverseBracket = (summon) => {
    //
};

_.resolveReverseLTGT = (summon) => {
    //
};

_.resolvePipe = (summon) => {
    //
};

module.exports = _;