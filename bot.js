require('dotenv').config(); //get the environment variables described in .env
const TelegramBot = require('node-telegram-bot-api');
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const util = require('util');
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const fs = require('fs');

const history_analyzer = require('./history_analyzer');

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
	polling: {
		autoStart: false
	}
});

const GL = {};
GL.muted = []; //charIds that have muted the bot
const DEV_TELEGRAM_ID = parseInt(process.env.DEV_TELEGRAM_ID) || 0;

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
	const chatId = msg.chat.id;

	try {

		if(msg.text) {
			//group commands
			if(msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
				//if this group has decided to mute roborugi or not
				if(GL.muted.indexOf(msg.chat.id) >= 0) {
					logger.log('Roborugi silences her tongue.');
					return; //intentionally do nothing else
				}

				//if message is `roborugi mute n`
				if(msg.text.match(/^roborugi mute [0-9]*$/) !== null) {
					let time = parseInt(msg.text.split(' ')[2]);
					let groupId = msg.chat.id;
					bot.sendMessage(chatId, 'Gomennasai, back in '+time+' minutes.');
					GL.muted.push(groupId);
					logger.log('Muted for group '+groupId+' for '+time+' minutes.');
					setTimeout(() => {
						GL.muted.splice(GL.muted.indexOf(groupId), 1);
						logger.log('Mute has expired, unmuted group '+groupId);
					}, time*1000*60);
				}
			}

			if (msg.text.startsWith('roborugi ping')) {
				bot.sendMessage(chatId, 'pong');
			}

			if (msg.text.startsWith('thanks roborugi')) {
				let catchphrases = ['I\'ll try my best', 'I don\'t know anyone by that name.', '( ´ ∀ `)'];
				bot.sendMessage(chatId, catchphrases[Math.floor(Math.random() * catchphrases.length)]);
			} else if (msg.text.startsWith('roborugi source code')) {
				bot.sendMessage(chatId, 'https://github.com/au5ton/Roboragi');
			}

			//developer tools
			if(msg.from.id === DEV_TELEGRAM_ID) {
				if (msg.text.startsWith('roborugi debug')) {
					logger.warn('[DEBUG]\nmsg: ', msg, '\nGL:', GL);
				}
				if(msg.text.startsWith('roborugi get earliest entry')) {
					history_analyzer.getEarliestEntryDate((date) => {
						bot.sendMessage(chatId, 'The earliest query I can remember was '+date);
					});
				}
				if(msg.text.startsWith('roborugi get entry count')) {
					history_analyzer.getEntryCount((count) => {
						bot.sendMessage(chatId, 'I have recorded '+count+' queries.');
					});
				}
				/*if(msg.text.match(/^roborugi get top queries [0-9]*$/) !== null) {
					let count = parseInt(msg.text.split(' ')[4]);
					history_analyzer.getTopAnime(count, (queries) => {
						let response = 'I';
						for(let i = 0; i < queries.length; i++) {
							rep
						}
						bot.sendMessage(chatId, response, {
							parse_mode: 'html',
							disable_web_page_preview: true
						});
					});
				}*/
			}
		}

	} catch (err) {
		// ¯\_(ツ)_/¯
		logger.log(err);
	}
	/*check if message is a query
	a messages is a query if:
	- there is exactly 1 `{` per message
	- there is exactly 1 `}` per message
	- the message matches the regex: \{([^)]+)\}
	OR
	- there is exactly 1 `<` per message
	- there is exactly 1 `>` per message
	- the message matches the regex: \<([^)]+)\>

	i feel like this could be refractored so please feel free to shit on my code
	*/
	let brace_l_cnt = brace_r_cnt = less_l_cnt = less_r_cnt = brack_l_cnt = brack_r_cnt = pipe_cnt = 0;

	if (msg.text) {
		for (let i = 0; i < msg.text.length; i++) {
			//Correctly tally the braces
			let next = msg.text.charAt(i);
			if (next === '{')
			brace_l_cnt++;
			else if (next === '}')
			brace_r_cnt++;
			else if (next === '<')
			less_l_cnt++;
			else if (next === '>')
			less_r_cnt++;
			else if (next === '[')
			brack_l_cnt++;
			else if (next === ']')
			brack_r_cnt++;
			else if (next === '|')
			pipe_cnt++;

		}
	}
	if (brace_l_cnt === 1 && brace_r_cnt === 1) {
		//perhaps an attempt to search {anime TV}
		let attempt = msg.text.match(/\{([^)]+)\}/);
		if (attempt !== null) {
			MAL.searchAnimes(attempt[1]).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (animes[i]['type'] === 'TV') {
							bot.sendMessage(chatId, buildAnimeChatMessage(animes[i]), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							recordQuery({
								cmd: 'braces',
								query: attempt[1],
								result_id: animes[i]['id'],
								chat_id: chatId
							});
							break;
						}
					}
				}
				else {
					//couldn't find an anime with that name
					recordQuery({
						cmd: 'braces',
						query: attempt[1],
						chat_id: chatId
					});
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		}
	}
	if (brack_l_cnt === 1 && brack_r_cnt === 1) {
		//perhaps an attempt to search [anime OVA+Movie]
		let attempt = msg.text.match(/\[([^)]+)\]/);
		if (attempt !== null) {
			MAL.searchAnimes(attempt[1]).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (animes[i]['type'] === 'OVA' || animes[i]['type'] === 'Movie') {
							bot.sendMessage(chatId, buildAnimeChatMessage(animes[i]), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							recordQuery({
								cmd: 'brackets',
								query: attempt[1],
								result_id: animes[i]['id'],
								chat_id: chatId
							});
							break;
						}
					}
				}
				else {
					//couldn't find an anime with that name
					recordQuery({
						cmd: 'brackets',
						query: attempt[1],
						chat_id: chatId
					});
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		}
	}
	if (pipe_cnt === 2) {
		//perhaps an attempt to search |anime exact title|
		let attempt = msg.text.match(/\|([^)]+)\|/);
		if (attempt !== null) {
			MAL.searchAnimes(attempt[1]).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (attempt[1].toLowerCase() === animes[i]['title'].toLowerCase() || attempt[1].toLowerCase() === animes[i]['english'].toLowerCase()) {
							bot.sendMessage(chatId, buildAnimeChatMessage(animes[i]), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							recordQuery({
								cmd: 'pipes',
								query: attempt[1],
								result_id: animes[i]['id'],
								chat_id: chatId
							});
						}
					}
				}
				else {
					//couldn't find an anime with that name
					recordQuery({
						cmd: 'pipes',
						query: attempt[1],
						chat_id: chatId
					});
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		}
	}
	if (less_l_cnt === 1 && less_r_cnt === 1) {
		//perhaps an attempt to search <manga>
		let attempt = msg.text.match(/\<([^)]+)\>/);
		if (attempt !== null) {
			MAL.searchMangas(attempt[1]).then((mangas) => {
				if (mangas[0] !== null) {
					bot.sendMessage(chatId, buildMangaChatMessage(mangas[0]), {
						parse_mode: 'html',
						disable_web_page_preview: true
					});
					recordQuery({
						cmd: 'ltgt',
						query: attempt[1],
						result_id: mangas[0]['id'],
						chat_id: chatId
					});
				}
				else {
					//couldn't find a manga with that name
					recordQuery({
						cmd: 'ltgt',
						query: attempt[1],
						chat_id: chatId
					});
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		}
	}

});

const star_char = '\u272A';

function buildAnimeChatMessage(anime, options) {
	options = options || {};
	let message = '';
	if (anime['english'] !== null && anime['english'] !== '') {
		message += '<b>' + anime['english'] + '</b>';
	} else {
		message += '<b>' + anime['title'] + '</b>';
	}
	message += ' (<a href=\"https://myanimelist.net/anime/' + anime['id'] + '\">MAL</a>)\n';
	message += anime['score'] + star_char + ' | ' + anime['type'] + ' | Status: ' + anime['status'] + ' | Episodes: ' + anime['episodes'];

	var firstParagraph = anime['synopsis'].split('\n')[0];
	var txtLimit = 180;
	if (firstParagraph.length > txtLimit) {
		firstParagraph = firstParagraph.substring(0, txtLimit - 3) + '...';
	}
	message += '\n' + firstParagraph;
	return message;
}

function buildMangaChatMessage(manga) {
	let message = '';
	if (manga['english'] !== null && manga['english'] !== '') {
		message += '<b>' + manga['english'] + '</b>';
	} else {
		message += '<b>' + manga['title'] + '</b>';
	}
	message += ' (<a href=\"https://myanimelist.net/manga/' + manga['id'] + '\">MAL</a>)\n';
	message += manga['score'] + star_char + ' | ' + manga['type'] + ' | Status: ' + manga['status'] + ' | Volumes: ' + manga['volumes'];
	return message;
}

function recordQuery(record) {
	//queries will be logged as one JSON object per line
	//ideally: {"date":"2017-06-25T23:07:29.772Z","cmd":"braces","result_id":11111,"query":"Another"}
	let entry = {};
	//copy data over to new Object, because hardcoding fields is bad and
	//some things might need to log more info in the future
	for(let k in record) {
		entry[k]=record[k];
	}
	//Sets default values
	entry['result_id'] = entry.result_id || -1;
	entry['date'] = new Date().toISOString();
	//asynchronous append because order doesn't matter if we timestamp it, we want performance.
	fs.appendFile('command_history.json', JSON.stringify(entry)+'\n', (err) => {
		if (err) throw err;
	});
}

logger.log('Bot active. Performing startup checks.');

logger.warn('Is our Telegram token valid?');
bot.getMe().then((r) => {
	//doesn't matter who we are, we're good
	logger.success('Telegram token is valid.');
	bot.startPolling().then((r) => {
		logger.success('Telegram bot polling started.');
	}).catch((r) => {
		logger.error('Telegram bot failed to start polling. ', r);
		process.exit();
	})
}).catch((r) => {
	logger.error('Telegram bot invalid token: ', r.code, ' ', r.body);
	process.exit();
});

logger.warn('Is our MAL authentication valid?');
MAL.verifyAuth().then((r) => {
	logger.success('MAL authenticated. ');
}).catch((r) => {
	logger.error('MAL failed to authenticate: ', r.message);
	process.exit();
});
