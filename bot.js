require('dotenv').config(); //get the environment variables described in .env
const Telegraf = require('telegraf')
const logger = require('au5ton-logger');
logger.setOption('prefix_date',true);
const util = require('util');
const path = require('path');
const fs = require('fs');
const git = require('git-last-commit');
const prettyMs = require('pretty-ms');
const VERSION = require('./package').version;

//
const START_TIME = new Date();
var BOT_USERNAME;

// Anime APIs
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const nani = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const Kitsu = require('kitsu');
const kitsu = new Kitsu();
const imdb = require('imdb-api');
const IMDB_TOKEN = {apiKey: process.env.OMDB_API_KEY, timeout: 5000};
const TVDB = require('node-tvdb');
const tvdb = new TVDB(process.env.THETVDB_API_KEY);

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
const Genres = require('./roboruri/classes/Genres');

// Create a bot that uses 'polling' to fetch new updates

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const DEV_TELEGRAM_ID = parseInt(process.env.DEV_TELEGRAM_ID) || 0;

process.on('unhandledRejection', r => logger.error(r));

// Basic commands

bot.hears(new RegExp('\/start|\/start@' + BOT_USERNAME), (context) => {
	context.getChat().then((chat) => {
		if(chat.type === 'private') {
			context.reply('Welcome!\n\n'+warning_sign+'Roboruri is currently in beta, so PLEASE report any issues you experience!'+warning_sign+'\n\nI reply with links to anime with the following format:\n{Toradora!}\n\nI reply with links to manga with the following format:\n<Game Over>\n\nI reply with links to light novels with the following format:\n]Re:Zero[\n\nI reply with links to Western television with the following format:\n|Game of Thrones|\n\nI reply with links to Western movies with the following format. Optionally, you can include the year in parenthesis:\n>Spider-man (2017)<\n\nAny response containing `'+prohibited_symbol+'` is NSFW content.\n\nIf roboruri doesn\'t recognize the anime you requested correctly, tell @austinj or leave an issue on github if you\'re socially awkward.\nhttps://github.com/au5ton/Roboruri/issues',{
		  	  disable_web_page_preview: true
		    });
		}
		else if (chat.type === 'group' || chat.type === 'supergroup'){
			context.reply('Message me directly for instructions.');
		}
	}).catch((err) => {
		//
	});
});

bot.hears(new RegExp('\/ping|\/ping@' + BOT_USERNAME), (context) => {
	context.reply('pong');
});
bot.hears(new RegExp('\/uptime|\/uptime@' + BOT_USERNAME), (context) => {
	context.reply(''+prettyMs(new Date() - START_TIME));
});

bot.hears(new RegExp('\/version|\/version@' + BOT_USERNAME), (context) => {
	git.getLastCommit(function(err, commit) {
		// read commit object properties
		context.reply('version '+VERSION+', commit '+commit['shortHash']+', last updated on '+new Date(parseInt(commit['authoredOn'])*1000).toDateString(),{
			disable_web_page_preview: true
		});
	});
});

bot.hears(new RegExp('\/commit|\/commit@' + BOT_USERNAME), (context) => {
	git.getLastCommit(function(err, commit) {
		// read commit object properties
		context.reply('https://github.com/au5ton/Roboruri/tree/'+commit['hash'],{
			disable_web_page_preview: true
		});
	});
})

bot.hears(new RegExp('\/flipcoin|\/flipcoin@' + BOT_USERNAME), (context) => {
	context.reply(Math.random() <= 0.5 ? 'Heads' : 'Tails');
})

// Listen for regex
bot.hears(/thanks roboruri|good bot/gi, (context) => {
	let catchphrases = [
		'I\'ll try my best',
		'I don\'t know anyone by that name.',
		'( ´ ∀ `)',
		'( ＾ワ＾)',
		'(* ◡‿◡)',
		'(￢_￢;)',
		'Arigatō',
		'I aim to please.'
	];
	context.reply(catchphrases[Math.floor(Math.random() * catchphrases.length)]);
});

bot.hears(/anime_irl/gi, (context) => {
	//1 in 100 chance
	if(Math.floor(Math.random()*100) < 1) {
		context.reply('me too thanks');
	}
});

bot.on('message', (context) => {
	//logger.log(context)
	//New members were added
	if(context.update.message.new_chat_members){
		let members = context.update.message.new_chat_members;
		for(let i in members) {
			if(members[i]['username'] === BOT_USERNAME) {
				context.reply('Ohayō, '+context.chat.title+'. ');
				context.telegram.sendVideo(context.chat.id, 'https://a.safe.moe/AAqRJ.mp4');
			}
		}
	}
	else if(context.updateType === 'message' && context.updateSubTypes.includes('text')) {
		//Message was received
		const message_str = context.update.message.text;
		const message_id =  context.update.message.message_id;
		if(typeof message_str === 'string' && message_str.length > 0) {
			//logger.log(context)
			//summon handlers
			bot_util.isValidBraceSummon(message_str).then((query) => {
				logger.log('Summon: {', query, '}');
				console.time('execution time');
				//logger.log('q: ', query);
				Searcher.matchFromCache('{'+query+'}').then((result) => {
					//boo yah
					context.reply(buildAnimeChatMessage(result), {
						parse_mode: 'html',
						disable_web_page_preview: false,
						disable_notification: true,
						reply_to_message_id: message_id
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					//nothing in cache
					Searcher.matchAnimeFromDatabase(query).then((result) => {
						//boo yah
						context.reply(buildAnimeChatMessage(result), {
							parse_mode: 'html',
							disable_web_page_preview: false,
							disable_notification: true,
							reply_to_message_id: message_id
						});
						console.timeEnd('execution time');
					}).catch((err) => {
						logger.warn('database empty: ', err);
						//nothing in database
						Searcher.searchAnimes(query).then((result) => {
							//logger.log(result);
							context.reply(buildAnimeChatMessage(result), {
								parse_mode: 'html',
								disable_web_page_preview: false,
								disable_notification: true,
								reply_to_message_id: message_id
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
			bot_util.isValidLTGTSummon(message_str).then((query) => {

				logger.log('Summon: <', query, '>');
				console.time('execution time');
				//logger.log('q: ', query);
				Searcher.matchFromCache('<'+query+'>').then((result) => {
					//boo yah
					context.reply(buildMangaChatMessage(result), {
						parse_mode: 'html',
						disable_web_page_preview: true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					//nothing in cache
					Searcher.matchMangaFromDatabase(query, 'Manga').then((result) => {
						//boo yah
						context.reply(buildMangaChatMessage(result), {
							parse_mode: 'html',
							disable_web_page_preview: true
						});
						console.timeEnd('execution time');
					}).catch((err) => {
						logger.warn('database empty: ', err);
						//nothing in database
						Searcher.searchManga(query, 'Manga').then((result) => {
							//logger.log(result);
							context.reply(buildMangaChatMessage(result), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							console.timeEnd('execution time');
						}).catch((r) => {
							//well that sucks
							if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
								logger.warn('q: <'+query+'> => '+filled_x)
							}
							else {
								logger.error('failed to search with Searcher: ', r);
							}
							console.timeEnd('execution time');
						});
					})
				});
			}).catch(()=>{});
			bot_util.isValidReverseBracketSummon(message_str).then((query) => {
				logger.log('Summon: ]', query, '[');
				console.time('execution time');
				//logger.log('q: ', query);
				Searcher.matchFromCache(']'+query+'[').then((result) => {
					//boo yah
					context.reply(buildMangaChatMessage(result), {
						parse_mode: 'html',
						disable_web_page_preview: true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					//nothing in cache
					Searcher.matchMangaFromDatabase(query, 'LN').then((result) => {
						//boo yah
						context.reply(buildMangaChatMessage(result), {
							parse_mode: 'html',
							disable_web_page_preview: true
						});
						console.timeEnd('execution time');
					}).catch((err) => {
						logger.warn('database empty: ', err);
						//nothing in database
						Searcher.searchManga(query, 'LN').then((result) => {
							//logger.log(result);
							context.reply(buildMangaChatMessage(result), {
								parse_mode: 'html',
								disable_web_page_preview: true
							});
							console.timeEnd('execution time');
						}).catch((r) => {
							//well that sucks
							if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
								logger.warn('q: ]'+query+'[ => '+filled_x)
							}
							else {
								logger.error('failed to search with Searcher: ', r);
							}
							console.timeEnd('execution time');
						});
					})
				});
			}).catch(()=>{});
			bot_util.isValidReverseLTGTSummon(message_str).then((query) => {
				logger.log('Summon: >', query, '<');
				console.time('execution time');
				Searcher.matchFromCache('>'+query+'<').then((result) => {
					context.reply(buildMovieChatMessage(result),{
						parse_mode: 'html',
						disable_web_page_preview: false
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					Searcher.searchWesternMovie(query).then((result) => {
						//logger.log(result);
						context.reply(buildMovieChatMessage(result),{
							parse_mode: 'html',
							disable_web_page_preview: false
						});
						console.timeEnd('execution time');
					}).catch((r) => {
						//well that sucks
						if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
							logger.warn('q: >'+query+'< => '+filled_x)
						}
						else {
							logger.error('failed to search with Searcher: ', r);
						}
						console.timeEnd('execution time');
					});
				});
			}).catch(()=>{});
			bot_util.isValidPipeSummon(message_str).then((query) => {
				logger.log('Summon: |', query, '|');
				console.time('execution time');
				Searcher.matchFromCache('|'+query+'|').then((result) => {
					context.reply(buildAnimeChatMessage(result),{
						parse_mode: 'html',
						disable_web_page_preview: true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					Searcher.searchWesternTelevision(query).then((result) => {
						//logger.log(result);
						context.reply(buildAnimeChatMessage(result),{
							parse_mode: 'html',
							disable_web_page_preview: true
						});
						console.timeEnd('execution time');
					}).catch((r) => {
						//well that sucks
						if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
							logger.warn('q: |'+query+'| => '+filled_x)
						}
						else {
							logger.error('failed to search with Searcher: ', r);
						}
						console.timeEnd('execution time');
					});
				});
			}).catch(()=>{});
		}

	}
});

var LastInlineRequest = {};
var to_be_removed = [];
const INLINE_SUMMON_DELAY = 500;
const TELEGRAM_SUMMON_TIMEOUT = 30000;
// Regularly checks every second for unresolved queries
setInterval(() => {
	//logger.warn(LastInlineRequest,'\n',to_be_removed)
	for(let from_id in LastInlineRequest) {
		let elapsed_time = new Date().getTime() - LastInlineRequest[from_id]['time_ms'];
		if(elapsed_time > INLINE_SUMMON_DELAY && elapsed_time < TELEGRAM_SUMMON_TIMEOUT && LastInlineRequest[from_id]['status'] === 'unprocessed') {
			LastInlineRequest[from_id]['status'] = 'pending';
			// safe to reply
			logger.warn('inline_query: ', LastInlineRequest[from_id]['query']);
			bot_util.isValidBraceSummon(LastInlineRequest[from_id]['query']).then((query) => {
				logger.log('Summon: {', query, '}');
				console.time('execution time');
				//logger.log('q: ', query);
				Searcher.matchFromCache('{'+query+'}').then((result) => {
					//boo yah
					bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
					LastInlineRequest[from_id]['status'] = 'done';
					to_be_removed.push(from_id);
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					//nothing in cache
					Searcher.matchAnimeFromDatabase(query).then((result) => {
						//boo yah
						bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
						console.timeEnd('execution time');
					}).catch((err) => {
						logger.warn('database empty: ', err);
						//nothing in database
						Searcher.searchAnimes(query).then((result) => {
							//logger.log(result);
							bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
							LastInlineRequest[from_id]['status'] = 'done';
							to_be_removed.push(from_id);
							console.timeEnd('execution time');
						}).catch((r) => {
							//well that sucks
							if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
								logger.warn('q: {'+query+'} => '+filled_x)
							}
							else {
								logger.error('failed to search with Searcher: ', r);
							}
							LastInlineRequest[from_id]['status'] = 'done';
							to_be_removed.push(from_id);
							console.timeEnd('execution time');
						});
					})
				});
			}).catch(()=>{
				//LastInlineRequest[from_id]['status'] = 'done';
				//to_be_removed.push(from_id);
			}).catch(()=>{});
			bot_util.isValidLTGTSummon(LastInlineRequest[from_id]['query']).then((query) => {

			    logger.log('Summon: <', query, '>');
			    console.time('execution time');
			    //logger.log('q: ', query);
			    Searcher.matchFromCache('<'+query+'>').then((result) => {
			        //boo yah
			        bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
					LastInlineRequest[from_id]['status'] = 'done';
					to_be_removed.push(from_id);
					console.timeEnd('execution time');
			    }).catch((err) => {
			        logger.warn('cache empty: ', err);
			        //nothing in cache
			        Searcher.matchMangaFromDatabase(query, 'Manga').then((result) => {
			            //boo yah
						bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
						console.timeEnd('execution time');
			        }).catch((err) => {
			            logger.warn('database empty: ', err);
			            //nothing in database
			            Searcher.searchManga(query, 'Manga').then((result) => {
			                //logger.log(result);
			                bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
							LastInlineRequest[from_id]['status'] = 'done';
							to_be_removed.push(from_id);
							console.timeEnd('execution time');
			            }).catch((r) => {
			                //well that sucks
			                if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
			                    logger.warn('q: <'+query+'> => '+filled_x)
			                }
			                else {
			                    logger.error('failed to search with Searcher: ', r);
			                }
							LastInlineRequest[from_id]['status'] = 'done';
							to_be_removed.push(from_id);
			                console.timeEnd('execution time');
			            });
			        })
			    });
			}).catch(()=>{
				//LastInlineRequest[from_id]['status'] = 'done';
				//to_be_removed.push(from_id);
			}).catch(()=>{});
			bot_util.isValidReverseBracketSummon(LastInlineRequest[from_id]['query']).then((query) => {
			    logger.log('Summon: ]', query, '[');
			    console.time('execution time');
			    //logger.log('q: ', query);
			    Searcher.matchFromCache(']'+query+'[').then((result) => {
			        //boo yah
					bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
					LastInlineRequest[from_id]['status'] = 'done';
					to_be_removed.push(from_id);
			        console.timeEnd('execution time');
			    }).catch((err) => {
			        logger.warn('cache empty: ', err);
			        //nothing in cache
			        Searcher.matchMangaFromDatabase(query, 'LN').then((result) => {
			            //boo yah
						bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
			            console.timeEnd('execution time');
			        }).catch((err) => {
			            logger.warn('database empty: ', err);
			            //nothing in database
			            Searcher.searchManga(query, 'LN').then((result) => {
			                //logger.log(result);
							bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
							LastInlineRequest[from_id]['status'] = 'done';
							to_be_removed.push(from_id);
			                console.timeEnd('execution time');
			            }).catch((r) => {
			                //well that sucks
			                if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
			                    logger.warn('q: ]'+query+'[ => '+filled_x)
			                }
			                else {
			                    logger.error('failed to search with Searcher: ', r);
			                }
							LastInlineRequest[from_id]['status'] = 'done';
							to_be_removed.push(from_id);
			                console.timeEnd('execution time');
			            });
			        })
			    });
			}).catch(()=>{
				//LastInlineRequest[from_id]['status'] = 'done';
				//to_be_removed.push(from_id);
			}).catch(()=>{});
			bot_util.isValidReverseLTGTSummon(LastInlineRequest[from_id]['query']).then((query) => {
			    logger.log('Summon: >', query, '<');
			    console.time('execution time');
			    Searcher.matchFromCache('>'+query+'<').then((result) => {
			        bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromMovie(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
					LastInlineRequest[from_id]['status'] = 'done';
					to_be_removed.push(from_id);
					console.timeEnd('execution time');
			    }).catch((err) => {
			        logger.warn('cache empty: ', err);
			        Searcher.searchWesternMovie(query).then((result) => {
			            //logger.log(result);
			            bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromMovie(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
			            console.timeEnd('execution time');
			        }).catch((r) => {
			            //well that sucks
			            if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
			                logger.warn('q: >'+query+'< => '+filled_x)
			            }
			            else {
			                logger.error('failed to search with Searcher: ', r);
			            }
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
			            console.timeEnd('execution time');
			        });
			    });
			}).catch(()=>{
				//LastInlineRequest[from_id]['status'] = 'done';
				//to_be_removed.push(from_id);
			}).catch(()=>{});
			bot_util.isValidPipeSummon(LastInlineRequest[from_id]['query']).then((query) => {
			    logger.log('Summon: |', query, '|');
			    console.time('execution time');
			    Searcher.matchFromCache('|'+query+'|').then((result) => {
					bot.telegram.answerInlineQuery(Object.assign({}, LastInlineRequest[from_id]['query_id']), [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
					LastInlineRequest[from_id]['status'] = 'done';
					to_be_removed.push(from_id);
			        console.timeEnd('execution time');
			    }).catch((err) => {
			        logger.warn('cache empty: ', err);
			        Searcher.searchWesternTelevision(query).then((result) => {
			            //logger.log(result);
						bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], [buildInlineQueryResultArticleFromAnime(result)]).catch((err) => {logger.error('answerInlineQuery failed to send: ',err)});
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
			            console.timeEnd('execution time');
			        }).catch((r) => {
			            //well that sucks
			            if(r === 'can\'t findBestMatchForAnimeArray if there are no titles') {
			                logger.warn('q: |'+query+'| => '+filled_x)
			            }
			            else {
			                logger.error('failed to search with Searcher: ', r);
			            }
						LastInlineRequest[from_id]['status'] = 'done';
						to_be_removed.push(from_id);
			            console.timeEnd('execution time');
			        });
			    });
			}).catch(()=>{
				//LastInlineRequest[from_id]['status'] = 'done';
				//to_be_removed.push(from_id);
			}).catch(()=>{});
		}
		if(elapsed_time > TELEGRAM_SUMMON_TIMEOUT) {
			//stores the user ids of users who cant have their request fullfilled anymore
			logger.warn('to_be_removed '+from_id+' due to timeout')
			to_be_removed.push(from_id);
		}
	}
	for(let i = to_be_removed.length-1; i >= 0; i--) {
		//removes the request info of users who cant have their request fullfilled anymore
		//logger.log(LastInlineRequest,'\n',to_be_removed);
		logger.warn('removing ',to_be_removed[i]);
		delete LastInlineRequest[to_be_removed[i]];
		to_be_removed.splice(i,1);

	}
},100);

bot.on('inline_query', (context) => {
	let from_id = context.update.inline_query.from.id; //telegram user id of requesting user
	//let from_id = context.update.inline_query.id; //actually use query id instead
	let time_ms = new Date().getTime(); //epoch time in milliseconds
	let query = context.update.inline_query.query; //the query the user made
	let query_id = context.update.inline_query.id; //the telegram inline query id, needed to use answerInlineQuery
	if(LastInlineRequest[from_id] === undefined) {
		LastInlineRequest[from_id] = {};
	}
	else {
		//logger.warn('updated query from ',from_id,': ',query);
	}
	LastInlineRequest[from_id]['time_ms'] = time_ms;
	LastInlineRequest[from_id]['query'] = query;
	LastInlineRequest[from_id]['query_id'] = query_id;
	LastInlineRequest[from_id]['status'] = 'unprocessed'; // unprocessed || pending || done
});

const star_char = '\u272A';
const star_char_alt = '\u2605';
const filled_x = '\u274C';
const warning_sign = '⚠️'; //please work
const prohibited_symbol = String.fromCodePoint(0x1f232);
const manga_symbol = String.fromCodePoint(0x1f4d4);
const tomato_symbol = String.fromCodePoint(0x1f345); //fresh
const rotten_symbol = String.fromCodePoint(0x1F922); //rotten
const bowing_symbol = String.fromCodePoint(0x1F647);
const empty_char = '&#8203;';

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

function getIdealIMDBRating(IMDBRatings) {
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
function truncatePlot(plot_str) {
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

function buildAnimeChatMessage(anime, options) {
	options = options || {};
	let message = '';
	if(anime['image'] !== null) {
		message += '\n<a href=\"'+anime['image']+'\">'+empty_char+'</a>';
	}
	message += '<b>' + anime['title'] + '</b>';
	message += ' ('+buildHyperlinksForAnime(anime)+')\n';

	//Western shit
	if(anime['actors_str'] !== null) {
		message += '<i>Actor(s): ' + anime['actors_str'] + '</i>\n';
	}
	if(anime['tvdb_score'] !== null) {
		message += anime['tvdb_score'] + star_char_alt + ' | ';
	}
	if(anime['imdb_ratings'] !== null) {
		let rate_string = getIdealIMDBRating(anime['imdb_ratings']);
		if(rate_string) {
			message += rate_string + ' | ';
		}
	}

	//Weeb/general shit
	if(anime['nsfw'] === true) {
		message += prohibited_symbol+' | ';
	}
	if(anime['score_str'] !== null) {
		message += anime['score_str'] + star_char + ' | ';
	}
	if(anime['rating'] !== null) {
		message += anime['rating'] + '%' + ' | ';
	}
	if(anime['rotten_rating'] !== null) {
		message += anime['rotten_rating'] + tomato_symbol + ' | ';
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
function buildMangaChatMessage(anime, options) {
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
	if(anime['rating'] !== null) {
		message += anime['rating'] + '%' + ' | ';
	}
	message += anime['media_type'] + ', ' + anime['status'] + '\n';
	message += 'Volumes: ' + anime['volumes'] + ' | Chapters: ' + anime['chapters'];
	message += '\n' + anime['synopsis'];
	return message;
}
function buildMovieChatMessage(movie, options) {
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
		let rate_string = getIdealIMDBRating(movie.ratings);
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
			if(plot_str !== 'N/A') {
				message += '\n'+truncatePlot(movie['plot']);
			}
			else {
				//do nothing
			}
		}
		else {
			message += '\n'+truncatePlot(movie['plot']);
		}
	}
	return message;
}

function buildInputMessageContentFromAnime(anime) {
	return {
		message_text: anime.flattened.format === 'Manga' ? buildMangaChatMessage(anime) : buildAnimeChatMessage(anime),
		parse_mode: 'html',
		disable_web_page_preview: false,
		disable_notification: true
	};
}

function buildInputMessageContentFromMovie(movie) {
	return {
		message_text: buildMovieChatMessage(movie),
		parse_mode: 'html',
		disable_web_page_preview: false,
		disable_notification: true
	};
}

function buildInlineQueryResultArticleFromAnime(anime, options) {
	return {
		type: 'article',
		id: String(Math.floor(Math.random()*10000)+1),
		title: anime['title'],
		input_message_content: buildInputMessageContentFromAnime(anime),
		description: anime['synopsis'],
		thumb_url: anime['image'] !== null ? anime['image'] : undefined
	};
}


function buildInlineQueryResultArticleFromMovie(movie, options) {
	return {
		type: 'article',
		id: String(Math.floor(Math.random()*10000)+1),
		title: movie['title'] + ' ('+movie['_year_data']+')',
		input_message_content: buildInputMessageContentFromMovie(movie),
		description: truncatePlot(movie['plot']),
		thumb_url: movie['poster'].startsWith('http') ? movie['poster'] : undefined
	};
}


logger.log('Bot active. Performing startup checks.');

logger.warn('Is our Telegram token valid?');
bot.telegram.getMe().then((r) => {
	//doesn't matter who we are, we're good
	logger.success('Telegram token valid for @',r.username);
	BOT_USERNAME = r.username;
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
    if (kitsu.isAuth) {
		logger.success('Kitsu authenticated.');
	}
    else {
		logger.error('Kitsu failed to authenticate.');
		process.exit();
	}
});

logger.warn('Is synonyms.db operational?');
const sqlite3 = require('sqlite3').verbose();
let loc = path.dirname(require.main.filename) + '/synonyms.db';
var db = new sqlite3.Database(loc, sqlite3.OPEN_READONLY);
try {
	db.serialize(() => {
		setTimeout(() => {
			//delay so the startup messages look better
			logger.success('Synonyms.db seems operational.');
		},1000);
	});
	db.close();
}
catch(err) {
	logger.error('Error serializing synonyms.db: ',err);
	process.exit();
}

logger.warn('IMDb/OMDb connection operational?');
imdb.getById('tt0090190', {apiKey: process.env.OMDB_API_KEY, timeout: 5000}).then((movie) => {
	if(String(movie['imdbid']) === 'tt0090190') {
		logger.success('IMDb/OMDb connection good.');
	}
	else {
		logger.warn('IMDb/OMDb connection is ... weird.');
	}
}).catch((err) => {
	logger.error('Error testing IMDb/OMDb connection: ',err);
	process.exit();
});

logger.warn('TheTVDB connection operational?');
tvdb.getSeriesById(71663).then((response) => {
	if(String(response['id']) === '71663') {
		logger.success('TheTVDB connection good.');
	}
	else {
		logger.warn('TheTVDB connection is ... weird.');
	}
}).catch((error) => {
	logger.error('Error testing TheTVDB connection: ',err);
	process.exit();
});
