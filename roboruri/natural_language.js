// natural_language.js

// libraries
const _ = {};
const natural = require('natural');
const speak = require('speakeasy-nlp');
const tokenizer = new natural.WordTokenizer();
const logger = require('au5ton-logger');

// globals
const BOT_NAMES = ['roboruri', 'bot', 'roboragi'];
//const BOT_NAMES = ['bot'];
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
    'thanks',
    'die',
    'you the best',
    'you\'re the best'
];
const ENGLISH_SENTENCE_ENDERS = [
    'is doing her best',
    'is trying her best',
    'is trying hard'
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
for(let i in BOT_NAMES) {
    VALID_MENTIONS.push(tokenizer.tokenize(BOT_NAMES[i]+' is '+MENTION_WILDCARD));
}
for(let i in BOT_NAMES) {
    VALID_MENTIONS.push(tokenizer.tokenize(BOT_NAMES[i]+' is a '+MENTION_WILDCARD));
}
for(let n in ENGLISH_SENTENCE_STARTERS) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS[n]+' '+BOT_NAMES[i]));
    }
}
for(let n in ENGLISH_SENTENCE_STARTERS) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(BOT_NAMES[i]+' '+ENGLISH_SENTENCE_ENDERS[n]));
    }
}
for(let n in ENGLISH_GREETINGS) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_GREETINGS[n]+' '+BOT_NAMES[i]));
    }
}

//logger.log(VALID_MENTIONS);

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

    if(bigger.length < small.length) {
        //logger.error('BADSIZE, small: ',small,'\nbigger: ',bigger);
        return false;
    }

    //makes a list of indexes in bigger where the beginning of small might be
    for(let i in bigger) {
        if(bigger[i] === small[0]) {
            indexes.push(parseInt(i));
        }
    }

    if(indexes.length === 0) {
        //logger.error('NOTTHERE, small: ',small,'\nbigger: ',bigger);
        return false;
    }
    //logger.warn('indexes: ',indexes);

    //traverses list where small might start
    for(let i in indexes) {
        //traverses small
        for(let n in small) {
            //logger.log('n:',parseInt(n),' indexes[i]:',indexes[i],' | `',bigger[indexes[i]+parseInt(n)],'` === `',small[parseInt(n)],'`');
            //if bigger at the index, plus whereever we're at in small, equals small whereever we're at in small
            if(bigger[indexes[i]+parseInt(n)] === small[parseInt(n)]) {
                //logger.success('good');
            }
            else if(small[parseInt(n)] === MENTION_WILDCARD) {
                //logger.success('wildcard');
            }
            else {
                //logger.warn('bad');
                //logger.error('MISMATCH, small: ',small,'\nbigger: ',bigger);
                return false; //'small' not complete
            }
        }
    }
    //logger.success('PERMITTED, small: ',small,'\nbigger: ',bigger);
    return true;
};

_.replaceWildcard = (ray) => {
    let arr = [];
    for(let i in ray) {
        if(ray[i] === MENTION_WILDCARD) {
            arr[parseInt(i)] = '____';
        }
        else {
            arr[parseInt(i)] = ray[i];
        }
    }
    return arr;
}

//asynchonous, return promise
_.respond = (message_str) => {
    return new Promise((resolve, reject) => {
        if(_.shouldRespond(message_str)) {
            let the_message = tokenizer.tokenize(message_str);

            for(let i in VALID_MENTIONS) {
                for(let n in the_message) {
                    //arrayInsideArrayWithSameOrder
                    if(_.arrayInsideArrayWithSameOrder(VALID_MENTIONS[i],the_message)) {
                        resolve(JSON.stringify(_.replaceWildcard(VALID_MENTIONS[i])));
                    }
                }
            }
        }
        else {
            reject('shouldRespond returned false');
        }
    });
};


module.exports = _;
