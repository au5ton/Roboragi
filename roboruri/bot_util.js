// bot_util.js

const DataSource = require('./enums').DataSource;

//const
const _ = {};

_.star_char = '\u272A';
_.star_char_alt = '\u2605';
_.filled_x = '\u274C';
_.warning_sign = '⚠️'; //please work
_.prohibited_symbol = String.fromCodePoint(0x1f232);
_.manga_symbol = String.fromCodePoint(0x1f4d4);
_.tomato_symbol = String.fromCodePoint(0x1f345); //fresh
_.rotten_symbol = String.fromCodePoint(0x1F922); //rotten
_.bowing_symbol = String.fromCodePoint(0x1F647);
_.empty_char = '&#8203;';

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
			//resolve(_.genEasterEggAnswerVoice('X-Files Theme','https://sooot.github.io/repo/roboruri/xfiles.mp3'));
		}
		if(message_str.toLowerCase() === 'audio running90s') {
			//resolve(_.genEasterEggAnswerVoice('Running in the 90s','https://sooot.github.io/repo/roboruri/running90s.mp3'));
		}
		if(message_str.toLowerCase() === 'audio oof') {
			//resolve(_.genEasterEggAnswerVoice('Roblox oof sound','https://sooot.github.io/repo/roboruri/oof.mp3'));
		}
		else if(message.toLowerCase() === 'block the bot') {
			//resolve(_.genEasterEggAnswerArticle('block the bot','<b>ｙｏｕ ｃａｎｔ ｂｌｏｃｋ ｔｈｅ ｂｏｔ</b>'));
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

_.cleanUpString = (str) => {
	let cleaned_up = str;
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
	return cleaned_up;
}

_.buildHyperlinksForAnime = (anime) => {
	let message = '';

	let exists = (val) => {
		return (val !== undefined);
	};

	//logger.log(anime);

	for(let e in DataSource) {
		if(DataSource[e] === DataSource.MAL && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">MAL</a>, ';
		}
		else if(DataSource[e] === DataSource.ANILIST && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">AL</a>, ';
		}
		else if(DataSource[e] === DataSource.KITSU && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">KIT</a>, ';
		}
		else if(DataSource[e] === DataSource.MANGAUPDATES && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">MU</a>, ';
		}
		else if(DataSource[e] === DataSource.ANIMEPLANET && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">A-P</a>, ';
		}
		else if(DataSource[e] === DataSource.IMDB && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">IMDB</a>, ';
		}
		else if(DataSource[e] === DataSource.TVDB && exists(anime.hyperlinks.dict[DataSource[e]])) {
			message += '<a href=\"'+anime.hyperlinks.dict[DataSource[e]]+'\">TVDB</a>, ';
		}
	}
	return message.substring(0,message.length-2); //remove trailing comma and space
}

_.getIdealIMDBRating = (IMDBRatings) => {
	let rate_string;
	let rate_source;
	for(let i in IMDBRatings) {
		if(IMDBRatings[i]['Source'] === 'Internet Movie Database') {
			if(rate_source === undefined) {
				let a_rating = IMDBRatings[i]['Value']; //8.1/10
				rate_string = a_rating + ' on IMDb';
				rate_source = IMDBRatings[i]['Source'];
			}
		}
		else if(IMDBRatings[i]['Source'] === 'Rotten Tomatoes') {
			let a_rating = IMDBRatings[i]['Value']; //92%
			rate_string = a_rating + ' on ' + tomato_symbol + '';
			rate_source = IMDBRatings[i]['Source'];
		}
		else if(IMDBRatings[i]['Source'] === 'Metacritic') {
			if(rate_source !== 'Rotten Tomatoes') {
				let a_rating = IMDBRatings[i]['Value']; //69/100
				rate_string = a_rating + ' on Metacritic';
				rate_source = IMDBRatings[i]['Source'];
			}
		}
		else {
			// let a_rating = movie.ratings[i]['Value'];
			// rate_source = movie.ratings[i]['Source'];
			// rate_string = a_rating + ' on '+rate_source+' | ';
		}
	}
	if(rate_string) {
		return rate_string;
	}
}
_.truncatePlot = (plot_str) => {
	let new_plot = '';
	if(plot_str) {
		const txtLimit = 220;
		let the_plot = plot_str.replace(new RegExp('<br>', 'g'), '')
		if (the_plot.length > txtLimit) {
			new_plot += the_plot.substring(0, txtLimit - 3) + '...';
		}
		else {
			new_plot += the_plot;
		}
	}
	return new_plot;
}

_.buildAnimeChatMessage = (anime, options) => {
	//REQUEST_COUNT++;
	options = options || {};
	let message = '';
	if(anime['image'] && anime['image'].startsWith('http')) {
		message += '\n<a href=\"'+anime['image']+'\">'+_.empty_char+'</a>';
	}
	message += '<b>' + anime['title'] + '</b>';
	message += ' ('+_.buildHyperlinksForAnime(anime)+')\n';

	//Western shit
	if(anime['actors_str'] !== null) {
		message += '<i>Actor(s): ' + anime['actors_str'] + '</i>\n';
	}
	if(anime['tvdb_score'] !== null) {
		message += anime['tvdb_score'] + _.star_char_alt + ' | ';
	}
	if(anime['imdb_ratings'] !== null) {
		let rate_string = _.getIdealIMDBRating(anime['imdb_ratings']);
		if(rate_string) {
			message += rate_string + ' | ';
		}
	}

	//Weeb/general shit
	if(anime['nsfw'] === true) {
		message += _.prohibited_symbol+' | ';
	}
	if(anime['score_str'] !== null) {
		message += anime['score_str'] + _.star_char + ' | ';
	}
	if(anime['rating'] !== null) {
		message += anime['rating'] + '%' + ' | ';
	}
	if(anime['rotten_rating'] !== null) {
		message += anime['rotten_rating'] + _.tomato_symbol + ' | ';
	}
	if(anime['media_type'] !== null) {
		message += anime['media_type'] + ' | ';
	}
	if(anime['status'] !== null) {
		message += 'Status: ' + anime['status'] + ' | ';
	}
	if(anime['episode_count'] !== null) {
		message += 'Episodes: ' + anime['episode_count'] + '\n';
	}
	if(anime['total_seasons'] !== null) {
		message += 'Seasons: ' + anime['total_seasons'] + '\n';
	}
	if(anime['next_episode_number'] !== null && anime['next_episode_countdown'] !== null && anime['format'] !== 'Western TV' && anime['format'] !== 'Western Movie') {
		let temp = parseInt(anime['next_episode_countdown']);
		temp = temp - (temp % 60); //remove extra seconds, so prettyMs doesn't get annoyingly specific
		temp *= 1000; //seconds -> milliseconds
		message += '<i>Episode '+anime['next_episode_number']+' airs in '+prettyMs(temp)+'</i>\n';
	}
	message += anime['synopsis'];
	return message;
}
_.buildMangaChatMessage = (anime, options) => {
	//REQUEST_COUNT++;
	options = options || {};
	let message = '';
	if(anime['image'].startsWith('http')) {
		message += '\n<a href=\"'+anime['image']+'\">'+_.empty_char+'</a>';
	}
	message += '<b>' + anime['title'] + '</b>';
	message += ' ('+_.buildHyperlinksForAnime(anime)+')\n';
	if(anime['nsfw'] === true) {
		message += _.prohibited_symbol+' | ';
	}
	if(anime['score_str'] !== null) {
		message += anime['score_str'] + _.star_char + ' | ';
	}
	if(anime['rating'] !== null) {
		message += anime['rating'] + '%' + ' | ';
	}
	message += anime['media_type'] + ', ' + anime['status'] + '\n';
	message += 'Volumes: ' + anime['volumes'] + ' | Chapters: ' + anime['chapters'];
	message += '\n' + anime['synopsis'];
	return message;
}
_.buildMovieChatMessage = (movie, options) => {
	//REQUEST_COUNT++;
	//logger.success(movie)
	options = options || {};
	let url = 'http://www.imdb.com/title/' + movie['imdbid'] + '/'
	let message = '';
	let unreleased = false;
	if(movie['poster'].startsWith('http')) {
		message += '\n<a href=\"'+movie['poster']+'\">'+empty_char+'</a>';
	}
	message += '<b>' + movie['title'] + '</b>';
	message += ' ('+movie['_year_data']+') (<a href=\"'+url+'\">IMDB</a>)\n';
	if(movie['director']) {
		message += '<i>Director(s): ' + movie['director'] + '</i>';
		if(movie['actors']) {
			message += ' ; ';
		}
	}
	if(movie['actors']) {
		message += '<i>Actor(s): ' + movie['actors'] + '</i>\n';
	}
	else if(movie['director']) {
		//if there are no actors listed, but there was a director listed
		message += '\n';
	}
	if(movie['released']) {
		if(new Date() < new Date(movie['released']) && movie['released'] !== 'N/A') {
			unreleased = true;
			message += 'Expected release: '+new Date(movie['released']).toDateString()+'\n';
		}
	}
	if(movie.ratings && !unreleased) {
		//logger.warn(movie.ratings);
		let rate_string = _.getIdealIMDBRating(movie.ratings);
		if(rate_string) {
			message += rate_string + ' | ';
		}
	}
	if(movie['rated'] && !unreleased) {
		message += movie['rated'] + ' | ';
	}
	if(movie['runtime']) {
		if(unreleased) {
			if(movie['runtime'] !== 'N/A') {
				message += movie['runtime'] + ' | ';
			}
			else {
				//do nothing
			}
		}
		else {
			message += movie['runtime'] + ' | ';
		}

	}
	if(movie['genres']) {
		if(unreleased) {
			if(movie['genres'] !== 'N/A') {
				message += movie['genres'];
			}
			else {
				//do nothing
			}
		}
		else {
			message += movie['genres'];
		}
	}
	if(movie['plot']) {
		if(unreleased) {
			if(movie['plot'] !== 'N/A') {
				message += '\n'+_.truncatePlot(movie['plot']);
			}
			else {
				//do nothing
			}
		}
		else {
			message += '\n'+_.truncatePlot(movie['plot']);
		}
	}
	return message;
}

_.buildInputMessageContentFromAnime = (anime) => {
	return {
		message_text: anime.flattened.format === 'Manga' ? buildMangaChatMessage(anime) : buildAnimeChatMessage(anime),
		parse_mode: 'html',
		disable_web_page_preview: false,
		disable_notification: true
	};
}

_.buildInputMessageContentFromMovie = (movie) => {
	return {
		message_text: buildMovieChatMessage(movie),
		parse_mode: 'html',
		disable_web_page_preview: false,
		disable_notification: true
	};
}

_.buildInlineQueryResultArticleFromAnime = (anime, options) => {
	return {
		type: 'article',
		id: String(Math.floor(Math.random()*10000)+1),
		title: anime['title'],
		input_message_content: buildInputMessageContentFromAnime(anime),
		description: anime['synopsis'],
		thumb_url: anime['image'] !== null ? anime['image'] : undefined
	};
}


_.buildInlineQueryResultArticleFromMovie = (movie, options) => {
	return {
		type: 'article',
		id: String(Math.floor(Math.random()*10000)+1),
		title: movie['title'] + ' ('+movie['_year_data']+')',
		input_message_content: buildInputMessageContentFromMovie(movie),
		description: truncatePlot(movie['plot']),
		thumb_url: movie['poster'].startsWith('http') ? movie['poster'] : undefined
	};
}



module.exports = _;
