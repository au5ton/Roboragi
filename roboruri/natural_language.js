// natural_language.js

// libraries
const _ = {};
const natural = require('natural');
const speak = require('speakeasy-nlp');
const tokenizer = new natural.WordTokenizer();
const logger = require('au5ton-logger');
const bot_util = require('./bot_util');

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
const ENGLISH_SENTENCE_STARTERS_ENDEARMENT = [
    'i love you',
    'love me',
    'fuck me'
];
const ENGLISH_SENTENCE_ENDEARMENT_RESPONSES = [
    '(づ￣ ³￣)づ',
    '(っಠ‿ಠ)っ',
    '(つ✧ω✧)つ',
    '(￣o￣) zzZZzzZZ',
    '(l|l º □ º)',
    '( º □ º)'
];
const ENGLISH_SENTENCE_STARTERS_POSITIVE = [
    'good job',
    'good',
    'who\'s a good',
    'who is a good',
    'thanks',
    'thank you',
    'you the best',
    'you\'re the best',
    'nice'
];
const ENGLISH_SENTENCE_POSITIVE_RESPONSES = [
    'I\'ll try my best',
    'I don\'t know anyone by that name.',
    '( ´ ∀ `)',
    '( ＾ワ＾)',
    '(* ◡‿◡)',
    '(´• ω •`)',
    'Arigatō',
    'I aim to please.'
];
const ENGLISH_SENTENCE_STARTERS_NEGATIVE = [
    'bad',
    'die',
    'i hate you',
    'fuck off',
    'shut up',
    'wrong '+MENTION_WILDCARD,
    'eat my ass'
];
const ENGLISH_SENTENCE_NEGATIVE_RESPONSES = [
    '凸(￣ヘ￣)',
    '(｡•́︿•̀｡)',
    '(￢_￢;)',
    '(＃￣ω￣)',
    '(╥﹏╥)',
    'Σ(°△°|||)',
    'Gomennasai'
];
const ENGLISH_SENTENCE_ENDERS_POSITIVE = [
    'is doing her best',
    'is trying her best',
    'is trying hard',
    'you the best',
    'you\'re the best',
    'you are the best'
];
const ENGLISH_SENTENCE_ENDERS_NEGATIVE = [
    'is bad',
    'is stupid',
    'is dumb',
    'is buggy',
    'is ugly',
    'bad',
    'die',
    'i hate you',
    'fuck off',
    'shut up',
    'eat my ass'
];
const ANIME_REFRENCES = {
    'I love Emilia!': {response:'You are a cruel man, Subaru-kun.', case_sensitive: true}, //Re:Zero
    'Omae Wa Mou Shindeiru': {response:'<b>Nani?!</b>', case_sensitive: false}, //meme
    'cactus juice': {responses: ['<i>It\'s the quenchiest!</i>','<i>It\'ll quench ya!</i>'], case_sensitive: false, includes_only: true}, //Avatar: TLA
    'Akihabara!': {response: 'We don\'t have time to sightsee.', case_sensitive: false}, //Oreimo
    'Feel free to verbally abuse me too if you\'d like': {response: 'I can\'t figure out if you\'re a nice person or a weird person.', case_sensitive: false} //Oreimo
};

//build valid mention tokens
for(let n in ENGLISH_SENTENCE_STARTERS_POSITIVE) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS_POSITIVE[n]+' '+BOT_NAMES[i]));
    }
}
for(let n in ENGLISH_SENTENCE_STARTERS_ENDEARMENT) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS_ENDEARMENT[n]+' '+BOT_NAMES[i]));
    }
}
for(let n in ENGLISH_SENTENCE_STARTERS_NEGATIVE) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS_NEGATIVE[n]+' '+BOT_NAMES[i]));
    }
}
for(let n in ENGLISH_SENTENCE_ENDERS_POSITIVE) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(BOT_NAMES[i]+' '+ENGLISH_SENTENCE_ENDERS_POSITIVE[n]));
    }
}
for(let n in ENGLISH_SENTENCE_ENDERS_NEGATIVE) {
    for(let i in BOT_NAMES) {
        VALID_MENTIONS.push(tokenizer.tokenize(BOT_NAMES[i]+' '+ENGLISH_SENTENCE_ENDERS_NEGATIVE[n]));
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
    message_str = bot_util.cleanUpString(message_str);
    //should respond if BOT_NAMES is present and isn't a summon
    let tokens = tokenizer.tokenize(message_str.toLowerCase());
    for(let n in SUMMON_SYMBOLS) {
        if(tokens.includes(SUMMON_SYMBOLS[n])) {
            return false;
        }
    }
    for(let i in BOT_NAMES) {
        if(tokens.includes(BOT_NAMES[i])) {
            return true;
        }
    }
    for(let key in ANIME_REFRENCES) {
        if(ANIME_REFRENCES[key]['case_sensitive']) {
            if(ANIME_REFRENCES[key]['includes_only']) {
                if(message_str.includes(key)) {
                    return true;
                }
            }
            else {
                if(message_str === key) {
                    return true;
                }
            }
        }
        else {
            if(ANIME_REFRENCES[key]['includes_only']) {
                if(message_str.toLowerCase().includes(key.toLowerCase())) {
                    return true;
                }
            }
            else {
                if(message_str.toLowerCase() === key.toLowerCase()) {
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

_.arraysEqual = (arr1, arr2) => {

    if(arr1.length !== arr2.length) {
        return false;
    }
    for(let i = 0; i < arr1.length; i++) {
        //logger.log('test')
        if(arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

//asynchonous, return promise
_.respond = (message_str) => {
    return new Promise((resolve, reject) => {
        message_str = bot_util.cleanUpString(message_str);
        if(_.shouldRespond(message_str)) {
            let the_message = tokenizer.tokenize(message_str.toLowerCase());

            for(let key in ANIME_REFRENCES) {
                if(ANIME_REFRENCES[key]['case_sensitive']) {
                    if(ANIME_REFRENCES[key]['includes_only']) {
                        if(message_str.includes(key)) {
                            if(ANIME_REFRENCES[key]['random_chance']) {
                                if(Math.random() < ANIME_REFRENCES[key]['random_chance']) {
                                    if(ANIME_REFRENCES[key]['responses']) {
                                        let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                        resolve(ANIME_REFRENCES[key]['responses'][random_index])
                                    }
                                    else {
                                        resolve(ANIME_REFRENCES[key]['response']);
                                    }
                                }
                                else {
                                    //do nothing
                                }
                            }
                            else if(ANIME_REFRENCES[key]['responses']) {
                                let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                resolve(ANIME_REFRENCES[key]['responses'][random_index])
                            }
                            else {
                                resolve(ANIME_REFRENCES[key]['response']);
                            }
                        }
                    }
                    else {
                        if(message_str === key) {
                            if(ANIME_REFRENCES[key]['random_chance']) {
                                if(Math.random() < ANIME_REFRENCES[key]['random_chance']) {
                                    if(ANIME_REFRENCES[key]['responses']) {
                                        let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                        resolve(ANIME_REFRENCES[key]['responses'][random_index])
                                    }
                                    else {
                                        resolve(ANIME_REFRENCES[key]['response']);
                                    }
                                }
                                else {
                                    //do nothing
                                }
                            }
                            else if(ANIME_REFRENCES[key]['responses']) {
                                let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                resolve(ANIME_REFRENCES[key]['responses'][random_index])
                            }
                            else {
                                resolve(ANIME_REFRENCES[key]['response']);
                            }
                        }
                    }
                }
                else {
                    if(ANIME_REFRENCES[key]['includes_only']) {
                        if(message_str.toLowerCase().includes(key.toLowerCase())) {
                            if(ANIME_REFRENCES[key]['random_chance']) {
                                if(Math.random() < ANIME_REFRENCES[key]['random_chance']) {
                                    if(ANIME_REFRENCES[key]['responses']) {
                                        let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                        resolve(ANIME_REFRENCES[key]['responses'][random_index])
                                    }
                                    else {
                                        resolve(ANIME_REFRENCES[key]['response']);
                                    }
                                }
                                else {
                                    //do nothing
                                }
                            }
                            else if(ANIME_REFRENCES[key]['responses']) {
                                let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                resolve(ANIME_REFRENCES[key]['responses'][random_index])
                            }
                            else {
                                resolve(ANIME_REFRENCES[key]['response']);
                            }
                        }
                    }
                    else {
                        if(message_str.toLowerCase() === key.toLowerCase()) {
                            if(ANIME_REFRENCES[key]['random_chance']) {
                                if(Math.random() < ANIME_REFRENCES[key]['random_chance']) {
                                    if(ANIME_REFRENCES[key]['responses']) {
                                        let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                        resolve(ANIME_REFRENCES[key]['responses'][random_index])
                                    }
                                    else {
                                        resolve(ANIME_REFRENCES[key]['response']);
                                    }
                                }
                                else {
                                    //do nothing
                                }
                            }
                            else if(ANIME_REFRENCES[key]['responses']) {
                                let random_index = Math.floor(Math.random()*ANIME_REFRENCES[key]['responses'].length);
                                resolve(ANIME_REFRENCES[key]['responses'][random_index])
                            }
                            else {
                                resolve(ANIME_REFRENCES[key]['response']);
                            }
                        }
                    }
                }
            }
            //logger.warn('no ANIME_REFRENCES')

            for(let i in VALID_MENTIONS) {
                //arrayInsideArrayWithSameOrder
                if(_.arrayInsideArrayWithSameOrder(VALID_MENTIONS[i],the_message)) {
                    //logger.log(VALID_MENTIONS[i]);
                    for(let j in BOT_NAMES) {
                        for(let n in ENGLISH_GREETINGS) {
                            if(_.arraysEqual(VALID_MENTIONS[i],tokenizer.tokenize(ENGLISH_GREETINGS[n]+' '+BOT_NAMES[j]))) {
                                //logger.success('yes');
                                let greetings = ['Ohayō','Hi','Hello'];
                                resolve(greetings[Math.floor(Math.random()*greetings.length)]);
                            }
                        }
                        for(let n in ENGLISH_SENTENCE_STARTERS_POSITIVE) {
                            if(_.arraysEqual(VALID_MENTIONS[i],tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS_POSITIVE[n]+' '+BOT_NAMES[j]))) {
                                resolve(ENGLISH_SENTENCE_POSITIVE_RESPONSES[Math.floor(Math.random()*ENGLISH_SENTENCE_POSITIVE_RESPONSES.length)]);
                            }
                        }
                        for(let n in ENGLISH_SENTENCE_STARTERS_NEGATIVE) {
                            if(_.arraysEqual(VALID_MENTIONS[i],tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS_NEGATIVE[n]+' '+BOT_NAMES[j]))) {
                                resolve(ENGLISH_SENTENCE_NEGATIVE_RESPONSES[Math.floor(Math.random()*ENGLISH_SENTENCE_NEGATIVE_RESPONSES.length)]);
                            }
                        }
                        for(let n in ENGLISH_SENTENCE_ENDERS_POSITIVE) {
                            //logger.log(tokenizer.tokenize(BOT_NAMES[j]+' '+ENGLISH_SENTENCE_ENDERS_POSITIVE[n]));
                            if(_.arraysEqual(VALID_MENTIONS[i],tokenizer.tokenize(BOT_NAMES[j]+' '+ENGLISH_SENTENCE_ENDERS_POSITIVE[n]))) {
                                //logger.success('yes');
                                resolve(ENGLISH_SENTENCE_POSITIVE_RESPONSES[Math.floor(Math.random()*ENGLISH_SENTENCE_POSITIVE_RESPONSES.length)]);
                            }
                        }
                        for(let n in ENGLISH_SENTENCE_ENDERS_NEGATIVE) {
                            if(_.arraysEqual(VALID_MENTIONS[i],tokenizer.tokenize(BOT_NAMES[j]+' '+ENGLISH_SENTENCE_ENDERS_NEGATIVE[n]))) {
                                resolve(ENGLISH_SENTENCE_NEGATIVE_RESPONSES[Math.floor(Math.random()*ENGLISH_SENTENCE_NEGATIVE_RESPONSES.length)]);
                            }
                        }
                        for(let n in ENGLISH_SENTENCE_STARTERS_ENDEARMENT) {
                            if(_.arraysEqual(VALID_MENTIONS[i],tokenizer.tokenize(ENGLISH_SENTENCE_STARTERS_ENDEARMENT[n]+' '+BOT_NAMES[j]))) {
                                resolve(ENGLISH_SENTENCE_ENDEARMENT_RESPONSES[Math.floor(Math.random()*ENGLISH_SENTENCE_ENDEARMENT_RESPONSES.length)]);
                            }
                        }
                    }

                    reject(JSON.stringify(_.replaceWildcard(VALID_MENTIONS[i])));
                }
            }
        }
        else {
            reject('shouldRespond returned false');
        }
    });
};


module.exports = _;
