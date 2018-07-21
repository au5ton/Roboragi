// util.js

const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const probe = require('probe-image-size');
const prettyMs = require('pretty-ms');
const DataSource = require('./enums').DataSource;

//const
const _ = {};

_.star_char = '\u272A';
_.star_char_alt = '\u2605';
_.star_char_alt2 = String.fromCharCode('10032');
_.filled_x = '\u274C';
_.warning_sign = '⚠️'; //please work
_.voltage_sign = '⚡';
_.prohibited_symbol = String.fromCodePoint(0x1f232);
_.manga_symbol = String.fromCodePoint(0x1f4d4);
_.tomato_symbol = String.fromCodePoint(0x1f345); //fresh
_.rotten_symbol = String.fromCodePoint(0x1F922); //rotten
_.bowing_symbol = String.fromCodePoint(0x1F647);
_.empty_char = '&#8203;';

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

_.getBestImage = (images) => {
	return new Promise((resolve, reject) => {
		let promises = [];
		for(let i in images.dict) {
			promises.push(new Promise((resolve, reject) => {
				probe(images.dict[i]).then(response => {
					response.error = false;
					resolve(response);
				}).catch(err => {
					logger.error(err);
					resolve({error: true});
				})
			}));
		}
		Promise.all(promises).then(results => {
			let best_area = 0;
			let best_img = null;
			for(let i in results) {
				if(!results[i].error) {
					if(best_area < results[i].width * results[i].height) {
						best_area = results[i].width * results[i].height;
						best_img = results[i].url;
					}
				}
			}
			if(best_img === null) {
				resolve('error: getBestImage failed, literally no image could resolve (???)')
			}
			else {
				resolve(best_img);
			}
		}).catch(err => {
			logger.error(err)
			resolve('error: getBestImage '+err);
		});
	});
};

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
	}
	return message.substring(0,message.length-2); //remove trailing comma and space
}

_.buildGenresForAnime = (anime) => {
	let message = '';

	let exists = (val) => {
		return (val !== undefined);
	};

	//logger.log(anime);
	for(let i in anime.genres.array) {
		message += '<i>'+anime.genres.array[i]+'</i>, ';
	}
	return message.substring(0,message.length-2); //remove trailing comma and space
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

//Async
_.buildAnimeChatMessage = (anime, options) => {
	return new Promise((resolve, reject) => {
		_.getBestImage(anime.images).then(best_image_url => {
			options = options || {};
			let message = '';
			if(best_image_url.startsWith('http')) {
				message += '\n<a href=\"'+best_image_url+'\">'+_.empty_char+'</a>';
			}
			message += '<b>' + anime['title'] + '</b>';
			message += ' ('+_.buildHyperlinksForAnime(anime)+')\n';

			//Weeb/general shit
			if(anime['nsfw'] === true) {
				message += _.prohibited_symbol+' | ';
			}
			if(anime['mal_score'] !== null) {
				message += anime['mal_score'] + _.star_char + ' | ';
			}
			if(anime['kitsu_score'] !== null) {
				message += anime['kitsu_score'] + _.voltage_sign + ' | ';
			}
			else if(anime['anilist_score'] !== null) {
				message += anime['anilist_score'] + '%' + ' | ';
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
			if(anime['genres'] !== null && anime['genres'].array.length > 0) {
				message += _.buildGenresForAnime(anime) + '\n';
			}
			if(anime['next_episode_number'] !== null && anime['next_episode_countdown'] !== null && anime['format'] !== 'Western TV' && anime['format'] !== 'Western Movie') {
				let temp = parseInt(anime['next_episode_countdown']);
				temp = temp - (temp % 60); //remove extra seconds, so prettyMs doesn't get annoyingly specific
				temp *= 1000; //seconds -> milliseconds
				message += '<i>Episode '+anime['next_episode_number']+' airs in '+prettyMs(temp)+'</i>\n';
			}
			message += anime['synopsis'];
			resolve(message);
		})
	})
}
//Async
_.buildMangaChatMessage = (anime, options) => {
	return new Promise((resolve, reject) => {
		_.getBestImage(anime.images).then(best_image_url => {
			options = options || {};
			let message = '';
			if(best_image_url.startsWith('http')) {
				message += '\n<a href=\"'+best_image_url+'\">'+_.empty_char+'</a>';
			}
			message += '<b>' + anime['title'] + '</b>';
			message += ' ('+_.buildHyperlinksForAnime(anime)+')\n';
			if(anime['nsfw'] === true) {
				message += _.prohibited_symbol+' | ';
			}
			if(anime['mal_score'] !== null) {
				message += anime['mal_score'] + _.star_char + ' | ';
			}
			if(anime['kitsu_score'] !== null) {
				message += anime['kitsu_score'] + _.voltage_sign + ' | ';
			}
			else if(anime['anilist_score'] !== null) {
				message += anime['anilist_score'] + '%' + ' | ';
			}
			message += anime['media_type'] + ', ' + anime['status'] + '\n';
			message += 'Volumes: ' + anime['volumes'] + ' | Chapters: ' + anime['chapters'] + '\n';
			if(anime['genres'] !== null && anime['genres'].array.length > 0) {
				message += _.buildGenresForAnime(anime) + '\n';
			}
			message += anime['synopsis'];
			resolve(message);
		})
	})
};

//async
_.buildInputMessageContentFromAnime = (anime) => {
	return new Promise((resolve, reject) => {
		if(anime.flattened.format === 'Manga') {
			_.buildMangaChatMessage(anime).then(composedMessage => {
				resolve({
					message_text: composedMessage,
					parse_mode: 'html',
					disable_web_page_preview: false,
					disable_notification: true
				});
			})
		}
		else {
			_.buildAnimeChatMessage(anime).then(composedMessage => {
				resolve({
					message_text: composedMessage,
					parse_mode: 'html',
					disable_web_page_preview: false,
					disable_notification: true
				});
			})
		}
	});
};

// Async
_.buildInlineQueryResultArticleFromAnime = (anime, options) => {
	return new Promise((resolve, reject) => {
		_.buildInputMessageContentFromAnime(anime).then(composedMessage => {
			resolve({
				type: 'article',
				id: String(Math.floor(Math.random()*10000)+1),
				title: anime['title'],
				input_message_content: composedMessage,
				description: anime['synopsis'],
				thumb_url: anime['image'] !== null ? anime['image'] : undefined
			});
		})
	});
};

module.exports = _;
