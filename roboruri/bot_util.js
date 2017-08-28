// util.js

const _ = {};

_.genEasterEggAnswerArticle = (title, desc) => {
	return [{
		type: 'article',
		id: String(Math.floor(Math.random()*10000)+1),
		title: title,
		input_message_content: {
			message_text: desc,
			parse_mode: 'html',
			disable_web_page_preview: false,
			disable_notification: true
		},
		description: 'do it',
		thumb_url: 'https://sooot.github.io/repo/roboruri/egg.png'
	}];
};

_.genEasterEggAnswerVoice = (title, url, desc) => {
	return [{
		type: 'voice',
		id: String(Math.floor(Math.random()*10000)+1),
		title: title,
		voice_url: url
	}];
}

_.genEasterEggAnswerAudio = (title, url, desc) => {
	return [{
		type: 'audio',
		id: String(Math.floor(Math.random()*10000)+1),
		title: title,
		audio_url: url,
		caption: title,
	}];
}

_.isEasterEgg = (message_str) => {
	return new Promise((resolve, reject) => {
		if(message_str.toLowerCase() === 'audio xfiles') {
			resolve(_.genEasterEggAnswerVoice('X-Files Theme','https://sooot.github.io/repo/roboruri/xfiles.mp3'));
		}
		else if(message.toLowerCase() === 'block the bot') {
			resolve(_.genEasterEggAnswerArticle('block the bot','<b>ｙｏｕ ｃａｎｔ ｂｌｏｃｋ ｔｈｅ ｂｏｔ</b>'));
		}
		else {
			reject('nothing');
		}
	});
};


_.isValidBraceSummon = (message_str) => {
	return new Promise((resolve, reject) => {
		let l_cnt = r_cnt = 0,
			result = false;
		for (let i = 0; i < message_str.length; i++) {
			//Correctly tally the braces
			let next = message_str.charAt(i);
			if (next === '{')
				l_cnt++;
			if (next === '}')
				r_cnt++;
		}
		let attempt = message_str.match(/\{([^{}]+)\}/);
		if (attempt !== null && l_cnt == 1 && r_cnt == 1) {
			let cleaned_up = attempt[1];
			cleaned_up = cleaned_up.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "\'");
			cleaned_up = cleaned_up.replace(/\u201c|\u201d|\u201e/g, '\"');
			cleaned_up = cleaned_up.replace(/\u02C6/g, '^');
			cleaned_up = cleaned_up.replace(/\u2039/g, '<');
			cleaned_up = cleaned_up.replace(/\u203A/g, '>');
			cleaned_up = cleaned_up.replace(/\u2013/g, '-');
			cleaned_up = cleaned_up.replace(/\u2014/g, '--');
			cleaned_up = cleaned_up.replace(/\u2026/g, '...');
			cleaned_up = cleaned_up.replace(/\u00A9/g, '(c)');
			cleaned_up = cleaned_up.replace(/\u00AE/g, '(r)');
			cleaned_up = cleaned_up.replace(/\u2122/g, 'TM');
			cleaned_up = cleaned_up.replace(/\u00BC/g, '1/4');
			cleaned_up = cleaned_up.replace(/\u00BD/g, '1/2');
			cleaned_up = cleaned_up.replace(/\u00BE/g, '3/4');
			cleaned_up = cleaned_up.replace(/[\u02DC|\u00A0]/g, " ");
			resolve(cleaned_up);
		} else {
			reject('not valid brace summon');
		}
	});
};

_.isValidReverseBracketSummon = (message_str) => {
	return new Promise((resolve, reject) => {
		let l_cnt = r_cnt = 0,
			result = false;
		for (let i = 0; i < message_str.length; i++) {
			//Correctly tally the braces
			let next = message_str.charAt(i);
			if (next === '[')
				l_cnt++;
			if (next === ']')
				r_cnt++;
		}
		let attempt = message_str.match(/\]([^)]+)\[/);
		if (attempt !== null && l_cnt == 1 && r_cnt == 1) {
			let cleaned_up = attempt[1];
			cleaned_up = cleaned_up.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "\'");
			cleaned_up = cleaned_up.replace(/\u201c|\u201d|\u201e/g, '\"');
			cleaned_up = cleaned_up.replace(/\u02C6/g, '^');
			cleaned_up = cleaned_up.replace(/\u2039/g, '<');
			cleaned_up = cleaned_up.replace(/\u203A/g, '>');
			cleaned_up = cleaned_up.replace(/\u2013/g, '-');
			cleaned_up = cleaned_up.replace(/\u2014/g, '--');
			cleaned_up = cleaned_up.replace(/\u2026/g, '...');
			cleaned_up = cleaned_up.replace(/\u00A9/g, '(c)');
			cleaned_up = cleaned_up.replace(/\u00AE/g, '(r)');
			cleaned_up = cleaned_up.replace(/\u2122/g, 'TM');
			cleaned_up = cleaned_up.replace(/\u00BC/g, '1/4');
			cleaned_up = cleaned_up.replace(/\u00BD/g, '1/2');
			cleaned_up = cleaned_up.replace(/\u00BE/g, '3/4');
			cleaned_up = cleaned_up.replace(/[\u02DC|\u00A0]/g, " ");
			resolve(cleaned_up);
		} else {
			reject('not valid ReverseBracket summon');
		}
	});
};

_.isValidBracketSummon = (message_str) => {
	return new Promise((resolve, reject) => {
		let l_cnt = r_cnt = 0,
			result = false;
		for (let i = 0; i < message_str.length; i++) {
			//Correctly tally the braces
			let next = message_str.charAt(i);
			if (next === '[')
				l_cnt++;
			if (next === ']')
				r_cnt++;
		}
		let attempt = message_str.match(/\[([^)]+)\]/);
		if (attempt !== null && l_cnt == 1 && r_cnt == 1) {
			let cleaned_up = attempt[1];
			cleaned_up = cleaned_up.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "\'");
			cleaned_up = cleaned_up.replace(/\u201c|\u201d|\u201e/g, '\"');
			cleaned_up = cleaned_up.replace(/\u02C6/g, '^');
			cleaned_up = cleaned_up.replace(/\u2039/g, '<');
			cleaned_up = cleaned_up.replace(/\u203A/g, '>');
			cleaned_up = cleaned_up.replace(/\u2013/g, '-');
			cleaned_up = cleaned_up.replace(/\u2014/g, '--');
			cleaned_up = cleaned_up.replace(/\u2026/g, '...');
			cleaned_up = cleaned_up.replace(/\u00A9/g, '(c)');
			cleaned_up = cleaned_up.replace(/\u00AE/g, '(r)');
			cleaned_up = cleaned_up.replace(/\u2122/g, 'TM');
			cleaned_up = cleaned_up.replace(/\u00BC/g, '1/4');
			cleaned_up = cleaned_up.replace(/\u00BD/g, '1/2');
			cleaned_up = cleaned_up.replace(/\u00BE/g, '3/4');
			cleaned_up = cleaned_up.replace(/[\u02DC|\u00A0]/g, " ");
			resolve(cleaned_up);
		} else {
			reject('not valid bracket summon');
		}
	});
};

_.isValidLTGTSummon = (message_str) => {
	return new Promise((resolve, reject) => {
		let l_cnt = r_cnt = 0,
			result = false;
		for (let i = 0; i < message_str.length; i++) {
			//Correctly tally the braces
			let next = message_str.charAt(i);
			if (next === '<')
				l_cnt++;
			if (next === '>')
				r_cnt++;
		}
		let attempt = message_str.match(/\<([^)]+)\>/);
		if (attempt !== null && l_cnt == 1 && r_cnt == 1) {
			let cleaned_up = attempt[1];
			cleaned_up = cleaned_up.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "\'");
			cleaned_up = cleaned_up.replace(/\u201c|\u201d|\u201e/g, '\"');
			cleaned_up = cleaned_up.replace(/\u02C6/g, '^');
			cleaned_up = cleaned_up.replace(/\u2039/g, '<');
			cleaned_up = cleaned_up.replace(/\u203A/g, '>');
			cleaned_up = cleaned_up.replace(/\u2013/g, '-');
			cleaned_up = cleaned_up.replace(/\u2014/g, '--');
			cleaned_up = cleaned_up.replace(/\u2026/g, '...');
			cleaned_up = cleaned_up.replace(/\u00A9/g, '(c)');
			cleaned_up = cleaned_up.replace(/\u00AE/g, '(r)');
			cleaned_up = cleaned_up.replace(/\u2122/g, 'TM');
			cleaned_up = cleaned_up.replace(/\u00BC/g, '1/4');
			cleaned_up = cleaned_up.replace(/\u00BD/g, '1/2');
			cleaned_up = cleaned_up.replace(/\u00BE/g, '3/4');
			cleaned_up = cleaned_up.replace(/[\u02DC|\u00A0]/g, " ");
			resolve(cleaned_up);
		} else {
			reject('not valid LTGT summon');
		}
	});
};

_.isValidReverseLTGTSummon = (message_str) => {
	return new Promise((resolve, reject) => {
		let l_cnt = r_cnt = 0,
			result = false;
		for (let i = 0; i < message_str.length; i++) {
			//Correctly tally the braces
			let next = message_str.charAt(i);
			if (next === '<')
				l_cnt++;
			if (next === '>')
				r_cnt++;
		}
		let attempt = message_str.match(/\>([^|]+)\</);
		if (attempt !== null && l_cnt == 1 && r_cnt == 1) {
			let cleaned_up = attempt[1];
			cleaned_up = cleaned_up.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "\'");
			cleaned_up = cleaned_up.replace(/\u201c|\u201d|\u201e/g, '\"');
			cleaned_up = cleaned_up.replace(/\u02C6/g, '^');
			cleaned_up = cleaned_up.replace(/\u2039/g, '<');
			cleaned_up = cleaned_up.replace(/\u203A/g, '>');
			cleaned_up = cleaned_up.replace(/\u2013/g, '-');
			cleaned_up = cleaned_up.replace(/\u2014/g, '--');
			cleaned_up = cleaned_up.replace(/\u2026/g, '...');
			cleaned_up = cleaned_up.replace(/\u00A9/g, '(c)');
			cleaned_up = cleaned_up.replace(/\u00AE/g, '(r)');
			cleaned_up = cleaned_up.replace(/\u2122/g, 'TM');
			cleaned_up = cleaned_up.replace(/\u00BC/g, '1/4');
			cleaned_up = cleaned_up.replace(/\u00BD/g, '1/2');
			cleaned_up = cleaned_up.replace(/\u00BE/g, '3/4');
			cleaned_up = cleaned_up.replace(/[\u02DC|\u00A0]/g, " ");
			resolve(cleaned_up);
		} else {
			reject('not valid ReverseLTGT summon');
		}
	});
};

_.isValidPipeSummon = (message_str) => {
	return new Promise((resolve, reject) => {
		let cnt = 0,
			result = false;
		for (let i = 0; i < message_str.length; i++) {
			//Correctly tally the braces
			if (message_str.charAt(i) === '|')
				cnt++;
		}
		let attempt = message_str.match(/\|([^|]+)\|/);
		if (attempt !== null && cnt == 2) {
			let cleaned_up = attempt[1];
			cleaned_up = cleaned_up.replace(/\u2018|\u2019|\u201A|\uFFFD/g, "\'");
			cleaned_up = cleaned_up.replace(/\u201c|\u201d|\u201e/g, '\"');
			cleaned_up = cleaned_up.replace(/\u02C6/g, '^');
			cleaned_up = cleaned_up.replace(/\u2039/g, '<');
			cleaned_up = cleaned_up.replace(/\u203A/g, '>');
			cleaned_up = cleaned_up.replace(/\u2013/g, '-');
			cleaned_up = cleaned_up.replace(/\u2014/g, '--');
			cleaned_up = cleaned_up.replace(/\u2026/g, '...');
			cleaned_up = cleaned_up.replace(/\u00A9/g, '(c)');
			cleaned_up = cleaned_up.replace(/\u00AE/g, '(r)');
			cleaned_up = cleaned_up.replace(/\u2122/g, 'TM');
			cleaned_up = cleaned_up.replace(/\u00BC/g, '1/4');
			cleaned_up = cleaned_up.replace(/\u00BD/g, '1/2');
			cleaned_up = cleaned_up.replace(/\u00BE/g, '3/4');
			cleaned_up = cleaned_up.replace(/[\u02DC|\u00A0]/g, " ");
			resolve(cleaned_up);
		} else {
			reject('not valid pipe summon');
		}
	});
};

// Stolen from: https://stackoverflow.com/a/8212878
_.millisecondsToStr = (milliseconds) => {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    // var seconds = temp % 60;
    // if (seconds) {
    //     return seconds + ' second' + numberEnding(seconds);
    // }
    return 'less than a second'; //'just now' //or other string you like;
};

module.exports = _;
