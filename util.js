// util.js

const _ = {};

_.isValidBraceSummon = (msg, callback, bad_callback) => {
    if(typeof bad_callback !== 'function') bad_callback = function(){};
    let l_cnt = r_cnt = 0, result = false;
    for (let i = 0; i < msg.text.length; i++) {
        //Correctly tally the braces
        let next = msg.text.charAt(i);
        if(next === '{')
        l_cnt++;
        if(next === '}')
        r_cnt++;
    }
    let attempt = msg.text.match(/\{([^)]+)\}/);
    if(attempt !== null && l_cnt == 1 && r_cnt == 1) {
		callback(attempt[1]);
    }
    else {
        bad_callback();
    }
};

_.isValidBracketSummon = (msg, callback, bad_callback) => {
    if(typeof bad_callback !== 'function') bad_callback = function(){};
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
		callback(attempt[1]);
    }
    else {
        bad_callback();
    }
};

_.isValidLTGTSummon = (msg, callback, bad_callback) => {
    if(typeof bad_callback !== 'function') bad_callback = function(){};
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
		callback(attempt[1]);
    }
    else {
        bad_callback();
    }
};

_.isValidPipeSummon = (msg, callback, bad_callback) => {
    if(typeof bad_callback !== 'function') bad_callback = function(){};
    let cnt = 0, result = false;
    for (let i = 0; i < msg.text.length; i++) {
        //Correctly tally the braces
        if(msg.text.charAt(i) === '|')
        cnt++;
    }
    let attempt = msg.text.match(/\|([^)]+)\|/);
    if(attempt !== null && l_cnt == 2) {
		callback(attempt[1]);
    }
    else {
        bad_callback();
    }
};

module.exports = _;
