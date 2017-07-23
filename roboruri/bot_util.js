// util.js

const _ = {};

_.isValidBraceSummon = (message_str) => {
    return new Promise((resolve, reject) => {
        let l_cnt = r_cnt = 0, result = false;
        for (let i = 0; i < message_str.length; i++) {
            //Correctly tally the braces
            let next = message_str.charAt(i);
            if(next === '{')
            l_cnt++;
            if(next === '}')
            r_cnt++;
        }
        let attempt = message_str.match(/\{([^{}]+)\}/);
        if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
            resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

_.isValidBracketSummon = (message_str) => {
    return new Promise((resolve, reject) => {
        let l_cnt = r_cnt = 0, result = false;
        for (let i = 0; i < message_str.length; i++) {
            //Correctly tally the braces
            let next = message_str.charAt(i);
            if(next === '[')
            l_cnt++;
            if(next === ']')
            r_cnt++;
        }
        let attempt = message_str.match(/\[([^)]+)\]/);
        if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
    		resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

_.isValidLTGTSummon = (message_str) => {
    return new Promise((resolve, reject) => {
        let l_cnt = r_cnt = 0, result = false;
        for (let i = 0; i < message_str.length; i++) {
            //Correctly tally the braces
            let next = message_str.charAt(i);
            if(next === '<')
            l_cnt++;
            if(next === '>')
            r_cnt++;
        }
        let attempt = message_str.match(/\<([^)]+)\>/);
        if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
    		resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

_.isValidPipeSummon = (message_str) => {
    return new Promise((resolve, reject) => {
        let cnt = 0, result = false;
        for (let i = 0; i < message_str.length; i++) {
            //Correctly tally the braces
            if(message_str.charAt(i) === '|')
            cnt++;
        }
        let attempt = message_str.match(/\|([^)]+)\|/);
        if(attempt !== null && l_cnt == 2) {
    		resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

module.exports = _;
