// util.js

const _ = {};

_.isValidBraceSummon = (msg) => {
    return new Promise((resolve, reject) => {
        let l_cnt = r_cnt = 0, result = false;
        for (let i = 0; i < msg.text.length; i++) {
            //Correctly tally the braces
            let next = msg.text.charAt(i);
            if(next === '{')
            l_cnt++;
            if(next === '}')
            r_cnt++;
        }
        let attempt = msg.text.match(/\{([^{}]+)\}/);
        if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
            resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

_.isValidBracketSummon = (msg) => {
    return new Promise((resolve, reject) => {
        let l_cnt = r_cnt = 0, result = false;
        for (let i = 0; i < msg.text.length; i++) {
            //Correctly tally the braces
            let next = msg.text.charAt(i);
            if(next === '[')
            l_cnt++;
            if(next === ']')
            r_cnt++;
        }
        let attempt = msg.text.match(/\[([^)]+)\]/);
        if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
    		resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

_.isValidLTGTSummon = (msg) => {
    return new Promise((resolve, reject) => {
        let l_cnt = r_cnt = 0, result = false;
        for (let i = 0; i < msg.text.length; i++) {
            //Correctly tally the braces
            let next = msg.text.charAt(i);
            if(next === '<')
            l_cnt++;
            if(next === '>')
            r_cnt++;
        }
        let attempt = msg.text.match(/\<([^)]+)\>/);
        if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
    		resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

_.isValidPipeSummon = (msg) => {
    return new Promise((resolve, reject) => {
        let cnt = 0, result = false;
        for (let i = 0; i < msg.text.length; i++) {
            //Correctly tally the braces
            if(msg.text.charAt(i) === '|')
            cnt++;
        }
        let attempt = msg.text.match(/\|([^)]+)\|/);
        if(attempt !== null && l_cnt == 2) {
    		resolve(attempt[1]);
        }
        else {
            reject();
        }
    });
};

module.exports = _;
