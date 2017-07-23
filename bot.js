require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const util = require('util');
const fs = require('fs');
const git = require('git-last-commit');
const VERSION = require('./package').version;

// Anime APIs
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const nani = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const Kitsu = require('kitsu');
const kitsu = new Kitsu();

// Custom modules
const bot_util = require('./roboruri/bot_util');
const Searcher = require('./roboruri/searcher');
const DataSource = require('./roboruri/enums').DataSource;


// Custom classes
const Resolved = require('./roboruri/classes/Resolved');
const Rejected = require('./roboruri/classes/Rejected');
const Anime = require('./roboruri/classes/Anime');
const Hyperlinks = require('./roboruri/classes/Hyperlinks');
const Synonyms = require('./roboruri/classes/Synonyms');

// Create a bot that uses 'polling' to fetch new updates

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const DEV_TELEGRAM_ID = parseInt(process.env.DEV_TELEGRAM_ID) || 0;

// Basic commands

bot.command('/start', (context) => {
	context.getChat().then((chat) => {
		if(chat.type === 'private') {
			context.reply('Welcome!\n\n'+warning_sign+'Roboruri is currently in beta, so PLEASE report any issues you experience!'+warning_sign+'\n\nI reply with links to anime with the following format:\n{anime}\n\nI reply with links to manga with the following format:\n<manga>\n\nI reply with links to light novels with the following format:\n]light novel[\n\nAny response containing `'+prohibited_symbol+'` is NSFW content.\n\nIf roboruri doesn\'t recognize the anime you requested correctly, tell @austinj or leave an issue on github if you\'re socially awkward.\nhttps://github.com/au5ton/Roboruri/issues',{
		  	  disable_web_page_preview: true
		    });
		}
	}).catch((err) => {
		//
	});
});

bot.command('/ping', (context) => {
	context.reply('pong');
});

bot.command('/version', (context) => {
	git.getLastCommit(function(err, commit) {
		// read commit object properties
		context.reply('version '+VERSION+', commit '+commit['shortHash']+', last updated on '+new Date(parseInt(commit['authoredOn'])*1000).toDateString()+'\n\nhttps://github.com/au5ton/Roboruri/tree/'+commit['hash'],{
			disable_web_page_preview: true
		});
	});
});

bot.command('/commit', (context) => {
	git.getLastCommit(function(err, commit) {
		// read commit object properties
		context.reply('https://github.com/au5ton/Roboruri/tree/'+commit['hash'],{
			disable_web_page_preview: true
		});
	});
})

// Listen for regex

bot.hears(/thanks roboruri|good bot/gi, (context) => {
	let catchphrases = ['I\'ll try my best', 'I don\'t know anyone by that name.', '( ´ ∀ `)'];
	context.reply(catchphrases[Math.floor(Math.random() * catchphrases.length)]);
});

bot.on('text', (context) => {
	const message_str = context.message.text;
	if(typeof message_str === 'string' && message_str.length > 0) {

		//summon handlers
		bot_util.isValidBraceSummon(message_str).then((query) => {
			console.time('execution time');
			//logger.log('q: ', query);
			Searcher.matchFromCache(query).then((result) => {
				//boo yah
				context.reply(buildAnimeChatMessage(result), {
					parse_mode: 'html',
					disable_web_page_preview: true
				});
				console.timeEnd('execution time');
			}).catch((err) => {
				//logger.error('NOTHING IN CACHE, WE GOIN ANYWAYS: ', err)
				//nothing in cache
				Searcher.matchFromDatabase(query).then((result) => {
					//boo yah
					context.reply(buildAnimeChatMessage(result), {
						parse_mode: 'html',
						disable_web_page_preview: true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					//logger.error('NOTHING IN DATABASE, WE GOIN ON: ', err)
					//nothing in database
					Searcher.searchAnimes(query).then((result) => {
						//logger.log(result);
						context.reply(buildAnimeChatMessage(result), {
							parse_mode: 'html',
							disable_web_page_preview: true
						});
						console.timeEnd('execution time');
					}).catch((r) => {
						//well that sucks
						if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
							logger.warn('q: {'+query+'} => '+filled_x)
						}
						else {
							logger.error('failed to search with Searcher: ', r);
						}
						console.timeEnd('execution time');
					});
				})
			});
		}).catch(()=>{});
		bot_util.isValidBracketSummon(message_str).then((query) => {
			MAL.searchAnimes(query).then((animes) => {
				logger.log(animes);
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (animes[i]['type'] === 'OVA' || animes[i]['type'] === 'Movie') {
							context.reply(buildAnimeChatMessage(animes[i]), {
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
		}).catch(()=>{});
		bot_util.isValidPipeSummon(message_str).then((query) => {
			MAL.searchAnimes(query).then((animes) => {
				if (animes[0] !== null) {
					for (let i = 0; i < animes.length; i++) {
						if (attempt[1].toLowerCase() === animes[i]['title'].toLowerCase() || attempt[1].toLowerCase() === animes[i]['english'].toLowerCase()) {
							context.reply(buildAnimeChatMessage(animes[i]), {
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
		}).catch(()=>{});
		bot_util.isValidLTGTSummon(message_str).then((query) => {
			MAL.searchMangas(attempt[1]).then((mangas) => {
				if (mangas[0] !== null) {
					context.reply(buildMangaChatMessage(mangas[0]), {
						parse_mode: 'html',
						disable_web_page_preview: true
					});
				}
			}).catch((r) => {
				//well that sucks
				logger.error('failed to search mal: ', r);
			});
		}).catch(()=>{});
	}
});

const star_char = '\u272A';
const filled_x = '\u274C';
const warning_sign = '\u26A0';
const prohibited_symbol = String.fromCodePoint(0x1f232);

function buildHyperlinksForAnime(anime) {
	let message = '';

	let exists = (val) => {
		return (val !== undefined);
	};

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
	}
	return message.substring(0,message.length-2); //remove trailing comma and space
}

function buildAnimeChatMessage(anime, options) {
	options = options || {};
	let message = '';
	message += '<b>' + anime['title'] + '</b>';
	message += ' ('+buildHyperlinksForAnime(anime)+')\n';
	if(anime['nsfw'] === true) {
		message += prohibited_symbol+' | ';
	}
	if(anime['score_str'] !== null) {
		message += anime['score_str'] + star_char + ' | ';
	}
	message += anime['media_type'] + ' | Status: ' + anime['status'] + ' | Episodes: ' + anime['episode_count'];
	message += '\n' + anime['synopsis'];
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
bot.telegram.getMe().then((r) => {
	//doesn't matter who we are, we're good
	logger.success('Telegram token valid for @',r.username);
	bot.startPolling();
}).catch((r) => {
	logger.error('Telegram bot failed to start polling:\n',r);
	process.exit();
});

logger.warn('Is our MAL authentication valid?');
MAL.verifyAuth().then((r) => {
	logger.success('MAL authenticated. ');
}).catch((r) => {
	logger.error('MAL failed to authenticate: ', r.message);
	process.exit();
});

logger.warn('Is out Kitsu authentication valid?');
kitsu.auth({
    clientId: process.env.KITSU_CLIENT_ID,
    clientSecret: process.env.KITSU_CLIENT_SECRET,
    username: process.env.KITSU_USER,
    password: process.env.KITSU_PASSWORD
}).then((access_token) => {
    if (kitsu.isAuth) logger.success('Kitsu authenticated.');
    else logger.error('Kitsu failed to authenticate.');
});
