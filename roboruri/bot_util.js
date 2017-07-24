// util.js

const _ = {};

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
			reject();
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
		let attempt = message_str.match(/\]([^)]+)\[/);
		if (attempt !== null && l_cnt == 1 && r_cnt == 1) {
			resolve(attempt[1]);
		} else {
			reject();
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
			resolve(attempt[1]);
		} else {
			reject();
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
		let attempt = message_str.match(/\|([^)]+)\|/);
		if (attempt !== null && l_cnt == 2) {
			resolve(attempt[1]);
		} else {
			reject();
		}
	});
};

module.exports = _;
