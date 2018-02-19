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

const START_TIME = new Date();
var BOT_USERNAME;

// analytics-y stuff?
var ACTIVE_CHATS = {};
var REQUEST_COUNT = 0;

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
const natural_language = require('./roboruri/natural_language');
const summon_resolver = require('./roboruri/summon_resolver');


// Custom classes
const Resolved = require('./roboruri/classes/Resolved');
const Rejected = require('./roboruri/classes/Rejected');
const Anime = require('./roboruri/classes/Anime');
const Hyperlinks = require('./roboruri/classes/Hyperlinks');
const Synonyms = require('./roboruri/classes/Synonyms');
const Genres = require('./roboruri/classes/Genres');
const Summon = require('./roboruri/classes/Summon');

// Create a bot that uses 'polling' to fetch new updates

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const DEV_TELEGRAM_ID = parseInt(process.env.DEV_TELEGRAM_ID) || 0;

process.on('unhandledRejection', r => logger.error('unhandledRejection: ',r.stack,'\n',r));

// Basic commands

bot.hears(new RegExp('\/start|\/start@' + BOT_USERNAME), (context) => {
	context.getChat().then((chat) => {
		if(chat.type === 'private') {
			context.reply('Welcome!\n\nI reply with links to anime with the following format:\n{Toradora!}\n\nI reply with links to manga with the following format:\n<Game Over>\n\nI reply with links to light novels with the following format:\n]Re:Zero[\n\nAny response containing `'+prohibited_symbol+'` is NSFW content.\n\nIf I don\'t recognize the anime you requested correctly, tell @austinj or leave an issue on github if you\'re socially awkward.\nhttps://github.com/au5ton/Roboruri/issues',{
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

bot.hears(/anime_irl/gi, (context) => {
	//1 in 100 chance
	if(Math.floor(Math.random()*100) < 1) {
		context.reply('me too thanks');
	}
});

// DEV TOOLS
bot.hears(new RegExp('\/blastmessage'), (context) => {
	if(context.update.message.from.id === parseInt(process.env.DEV_TELEGRAM_ID) && context.update.message.chat.type === 'private') {
		if(context.updateType === 'message' && context.updateSubTypes.includes('text')) {
			//Message was received
			let cmd_portion = '\/blastmessage';
			let received_msg = context.update.message.text;
			let blast_msg = received_msg.substring(received_msg.indexOf(cmd_portion)+cmd_portion.length);
			//context.reply('active chats: '+ACTIVE_CHATS.length);
			for(let i in ACTIVE_CHATS) {
				context.telegram.sendMessage(i,blast_msg);
			}
		}
	}
})

bot.hears(new RegExp('\/activechats|\/activechats@' + BOT_USERNAME), (context) => {
	if(context.update.message.from.id === parseInt(process.env.DEV_TELEGRAM_ID)) {
		if(context.updateType === 'message' && context.updateSubTypes.includes('text')) {
			context.reply('active chats: '+Object.keys(ACTIVE_CHATS).length);
		}
	}
})

bot.hears(new RegExp('\/requestcount|\/requestcount@' + BOT_USERNAME), (context) => {
	if(context.update.message.from.id === parseInt(process.env.DEV_TELEGRAM_ID)) {
		if(context.updateType === 'message' && context.updateSubTypes.includes('text')) {
			context.reply(REQUEST_COUNT+' requests since '+START_TIME.toString());
		}
	}
})

// every hour
setInterval(() => {
	for(let i in ACTIVE_CHATS) {
		let diff = new Date() - new Date(ACTIVE_CHATS[i]); //milliseconds passed
		let week_in_ms = 604800000; //6.048e+8
		if(diff > week_in_ms) {
			delete ACTIVE_CHATS[i];
		}
	}
},3600000);

bot.on('message', (context) => {
	//context.reply(JSON.stringify(context.update));
	//New members were added

	if(context.update.message.chat.type === 'group' || context.update.message.chat.type === 'supergroup') {
		// I want roboruri to be privacy conscious, so I will only keep ACTIVE_CHATS in memory. Between bot restarts, this will be cleared.
		ACTIVE_CHATS[context.update.message.chat.id] = new Date();
	}

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
		const message_from = context.update.message.from;
		if(typeof message_str === 'string' && message_str.length > 0) {

			bot_util.isValidBraceSummon(message_str).then((query) => {
				summon_resolver.resolveBrace(new Summon('call', query, new Telegraf(process.env.TELEGRAM_BOT_TOKEN), {
					chat_id: message_from.id,
					reply_to_message_id: message_id
				}));
			}).catch((err)=>{
				logger.log(err);
			});
			bot_util.isValidLTGTSummon(message_str).then((query) => {

				logger.log('Summon: <', query, '>');
				console.time('execution time');
				//logger.log('q: ', query);
				Searcher.matchFromCache('<'+query+'>').then((result) => {
					//boo yah
					context.reply(buildMangaChatMessage(result), {
						parse_mode: 'html',
						disable_web_page_preview: result['image'].startsWith('http') ? false : true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					//nothing in cache
					Searcher.matchMangaFromDatabase(query, 'Manga').then((result) => {
						//boo yah
						context.reply(buildMangaChatMessage(result), {
							parse_mode: 'html',
							disable_web_page_preview: result['image'].startsWith('http') ? false : true
						});
						console.timeEnd('execution time');
					}).catch((err) => {
						logger.warn('database empty: ', err);
						//nothing in database
						Searcher.searchManga(query, 'Manga').then((result) => {
							//logger.log(result);
							context.reply(buildMangaChatMessage(result), {
								parse_mode: 'html',
								disable_web_page_preview: result['image'].startsWith('http') ? false : true
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
						disable_web_page_preview: result['image'].startsWith('http') ? false : true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					//nothing in cache
					Searcher.matchMangaFromDatabase(query, 'LN').then((result) => {
						//boo yah
						context.reply(buildMangaChatMessage(result), {
							parse_mode: 'html',
							disable_web_page_preview: result['image'].startsWith('http') ? false : true
						});
						console.timeEnd('execution time');
					}).catch((err) => {
						logger.warn('database empty: ', err);
						//nothing in database
						Searcher.searchManga(query, 'LN').then((result) => {
							//logger.log(result);
							context.reply(buildMangaChatMessage(result), {
								parse_mode: 'html',
								disable_web_page_preview: result['image'].startsWith('http') ? false : true
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
						disable_web_page_preview: result['poster'].startsWith('http') ? false : true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					Searcher.searchWesternMovie(query).then((result) => {
						//logger.log(result);
						context.reply(buildMovieChatMessage(result),{
							parse_mode: 'html',
							disable_web_page_preview: result['poster'].startsWith('http') ? false : true
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
						disable_web_page_preview: result['image'].startsWith('http') ? false : true
					});
					console.timeEnd('execution time');
				}).catch((err) => {
					logger.warn('cache empty: ', err);
					Searcher.searchWesternTelevision(query).then((result) => {
						//logger.log(result);
						context.reply(buildAnimeChatMessage(result),{
							parse_mode: 'html',
							disable_web_page_preview: (result['image'] && result['image'].startsWith('http')) ? false : true
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

			//will only response if she should respond
			//logger.log(context.update.message);
			if(context.update.message.from.username !== BOT_USERNAME || !context.update.message.from.is_bot) {

				let ignore_list = [
					411812615
				];

				//ignore someone
				if(!ignore_list.includes(message_from)) {
					natural_language.respond(message_str).then((response_str) => {
						context.reply(response_str, {
							parse_mode: 'html',
							reply_to_message_id: message_id
						});
					}).catch((err)=>{
						// shouldRespond returned false
						//logger.error(err);
					});
				}
			}
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

			bot_util.isEasterEgg(LastInlineRequest[from_id]['query']).then((answer) => {
				bot.telegram.answerInlineQuery(LastInlineRequest[from_id]['query_id'], answer).catch((err) => {
					logger.error('answerInlineQuery failed to send: ',err)
				});
				LastInlineRequest[from_id]['status'] = 'done';
				to_be_removed.push(from_id);
			}).catch(()=>{});

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
}).catch((err) => {
	logger.error('Kitsu failed to authenticate: ', err);
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
imdb.getById('tt0090190', {apiKey: process.env.OMDB_API_KEY, timeout: 15000}).then((movie) => {
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
