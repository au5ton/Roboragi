const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const fs = require('fs');
const readline = require('readline');

var _ = {};

_.sorter = {};
_.sorter.chronologically = function(a,b) {
    //array.sort() compatible function
    return new Date(b.date) - new Date(a.date);
};

//If you don't care about the order or anything, you just want to run code on each line
_.parseEach = function(do_line, callback) {
    if(typeof do_line !== 'function') return; //wastin' my damn time smh
    if(typeof callback !== 'function') callback = function(){};
    var reader = readline.createInterface({
        input: fs.createReadStream('command_history.json')
    });
    reader.on('line', (line) => {
        try {
            do_line(JSON.parse(line));
        }
        catch(err) {
            //anticipating some JSONs to not parse for whatever reason
            //intentionally don't call back the entry
            logger.error('Failed to process a line in .parseEach(): ', err);
        }
    });
    reader.on('close', () => {
        callback();
    });
};

//Shortcut to get an organized list of all the line data, memory wasteful though
_.parseAll = function(callback) {
    let lines = [];
    _.parseEach((line) => {
        lines.push(line);
    }, () => {
        callback(lines);
    });
};

_.getEarliestEntryDate = function(callback) {
    if(typeof callback !== 'function') return; //wastin' my damn time smh
    let earliestTime = Number.MAX_VALUE;
    _.parseEach((line) => {
        if(new Date(line.date) < earliestTime) {
            earliestTime = new Date(line.date);
        }
    },() => {
        if(earliestTime === Number.MAX_VALUE) {
            logger.warn('Abnormal behaviour! Each line was parsed, but the earliest line is still MAX_VALUE');
        }
        callback(earliestTime);
    })
};

_.getEntryCount = function(callback) {
    let lineCount = 0;
    _.parseEach((line) => {
        lineCount++;
    }, () => {
        callback(lineCount);
    });
};

module.exports = _;
