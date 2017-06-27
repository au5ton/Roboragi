require('dotenv').config(); //get the environment variables described in .env
const TelegramBot = require('node-telegram-bot-api');
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const util = require('util');
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const fs = require('fs');
const git = require('git-last-commit');
const bot_util = require('./util');

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

	if(msg.text) {
		//group commands
		if(msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
			//if this group has decided to mute roboruri or not
			if(GL.muted.indexOf(msg.chat.id) >= 0) {
				logger.log('Roboruri silences her tongue.');
				return; //intentionally do nothing else
			}

			//if message is `roboruri mute n`
			if(msg.text.match(/^roboruri mute [0-9]*$/) !== null) {
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
		else if (msg.chat.type === 'private'){
			//when the bot is being talked to one-on-one

			if(msg.text.startsWith('roboruri version')) {
				git.getLastCommit(function(err, commit) {
					// read commit object properties
					bot.sendMessage(chatId, 'commit '+commit['shortHash']+', last updated on '+new Date(parseInt(commit['authoredOn'])*1000).toDateString());
				});

			}
			else if(msg.text.startsWith('roboruri commit')) {
				git.getLastCommit(function(err, commit) {
					// read commit object properties
					bot.sendMessage(chatId, 'https://github.com/au5ton/Roboragi/tree/'+commit['hash']);
				});
			}
		}

		if (msg.text.startsWith('roboruri ping')) {
			bot.sendMessage(chatId, 'pong');
		}

		if (msg.text.startsWith('thanks roboruri')) {
			let catchphrases = ['I\'ll try my best', 'I don\'t know anyone by that name.', '( ´ ∀ `)'];
			bot.replyTo(chatId, catchphrases[Math.floor(Math.random() * catchphrases.length)]);
		} else if (msg.text.startsWith('roboruri source code')) {
			bot.sendMessage(chatId, 'https://github.com/au5ton/Roboragi');
		}

		//developer tools
		if(msg.from.id === DEV_TELEGRAM_ID) {
			if (msg.text.startsWith('roboruri debug')) {
				logger.warn('[DEBUG]\nmsg: ', msg, '\nGL:', GL);
			}
			if(msg.text.startsWith('roboruri get earliest entry')) {
				history_analyzer.getEarliestEntryDate((date) => {
					bot.sendMessage(chatId, 'The earliest query I can remember was '+date);
				});
			}
			if(msg.text.startsWith('roboruri get entry count')) {
				history_analyzer.getEntryCount((count) => {
					bot.sendMessage(chatId, 'I have recorded '+count+' queries.');
				});
			}
		}

		//summon handlers
		bot_util.isValidBraceSummon(msg, (query) => {
			MAL.searchAnimes(query).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (animes[i]['type'] === 'TV') {
							bot.sendMessage(chatId, buildAnimeChatMessage(animes[i]), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							break;
						}
					}
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		});
		bot_util.isValidBracketSummon(msg, (query) => {
			MAL.searchAnimes(query).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (animes[i]['type'] === 'OVA' || animes[i]['type'] === 'Movie') {
							bot.sendMessage(chatId, buildAnimeChatMessage(animes[i]), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							break;
						}
					}
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		});
		bot_util.isValidPipeSummon(msg, (query) => {
			MAL.searchAnimes(query).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (attempt[1].toLowerCase() === animes[i]['title'].toLowerCase() || attempt[1].toLowerCase() === animes[i]['english'].toLowerCase()) {
							bot.sendMessage(chatId, buildAnimeChatMessage(animes[i]), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
						}
					}
				}

			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		});
		bot_util.isValidLTGTSummon(msg, (query) => {
			MAL.searchMangas(attempt[1]).then((mangas) => {
				if (mangas[0] !== null) {
					bot.sendMessage(chatId, buildMangaChatMessage(mangas[0]), {
						parse_mode: 'html',
						disable_web_page_preview: true
					});
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		});
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