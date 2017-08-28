// natural_language.js

// libraries
const _ = {};
const natural = require('natural');
const speak = require('speakeasy-nlp');
const tokenizer = new natural.WordTokenizer();
const logger = require('au5ton-logger');

// globals
const BOT_NAMES = ['roboruri', 'bot', 'roboragi'];
const SUMMON_SYMBOLS = ['{','}','[',']','<','>','|'];
var VALID_MENTIONS = [];
const MENTION_WILDCARD = 'dea5d6976f7c54b48ff5d6c539121232f52092ef'; //sha1 hash of 'WILDCARD'
//under the assumption someone wont type that normally ^
const ENGLISH_GREETINGS = [
    'hello',
    'hi',
    'whats up',
    'what\'s up',
    'what is up'
];
const ENGLISH_SENTENCE_STARTERS = [
    'good job',
    'i love you',
    'good',
    'bad',
    'who\'s a good',
    'who is a good',
    'thanks'
]
//build valid mention tokens

/*

direct mention
==============
Good job roboruri
I love you roboruri
Bad roboruri
Wrong * roboruri
Who's a good roboruri?
thanks roboruri
good roboruri
hi roboruri
what's up roboruri
roboruri die
Roboruri you the best


*/

for(let i in BOT_NAMES) {
    VALID_MENTIONS.push(tokenizer.tokenize('wrong '+MENTION_WILDCARD+' '+BOT_NAMES[i]));
}
for(let n in ENGLISH_SENTENCE_STARTERS) {
    for(let n in ENGLISH_GREETINGS) {
        for(let i in BOT_NAMES) {
            VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS[n]+' '+BOT_NAMES[i]));
        }
    }
}
for(let n in ENGLISH_GREETINGS) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_GREETINGS[n]+' '+BOT_NAMES[i]));
    }
}

//synchronous, return true or false
_.shouldRespond = (message_str) => {
    //should respond if BOT_NAMES is present and isn't a summon
    let tokens = tokenizer.tokenize(message_str.toLowerCase());
    for(let n in SUMMON_SYMBOLS) {
        if(!tokens.includes(SUMMON_SYMBOLS[n])) {
            for(let i in BOT_NAMES) {
                if(tokens.includes(BOT_NAMES[i])) {
                    return true;
                }
            }
        }
    }
    return false;
};

_.arrayInsideArrayWithSameOrder = (small, bigger) => {
    let indexes = [];
    //makes a list of indexes in bigger where the beginning of small might be
    for(let i in bigger) {
        if(bigger[i] === small[0]) {
            indexes.push(parseInt(i));
        }
    }
    logger.warn('indexes: ',indexes);

    //traverses list where small might start
    for(let i in indexes) {
        //traverses small
        for(let n in small) {
            logger.log('n:',parseInt(n),' indexes[i]:',indexes[i],' | `',bigger[indexes[i]+parseInt(n)],'` === `',small[parseInt(n)],'`');
            //if bigger at the index, plus whereever we're at in small, equals small whereever we're at in small
            if(bigger[indexes[i]+parseInt(n)] === small[parseInt(n)]) {
                logger.success('good');
            }
            else if(small[parseInt(n)] === MENTION_WILDCARD) {
                logger.success('wildcard');
            }
            else {
                logger.warn('bad');
                return false; //'small' not complete
            }
        }
    }
    return true;
};

//asynchonous, return promise
// _.respond = (message_str) => {
//     return new Promise((resolve, reject) => {
//         if(_.shouldRespond(message_str)) {
//             let the_message = tokenizer.tokenize(message_str);
//
//             for(let i in VALID_MENTIONS) {
//                 for(let n in the_message) {
//                     if()
//                 }
//             }
//         }
//         else {
//             reject('shouldRespond returned false');
//         }
//     });
// };


module.exports = _;
