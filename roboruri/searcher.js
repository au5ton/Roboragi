// searcher.js

const _ = {};
const logger = require('au5ton-logger');
const stringSimilarity = require('string-similarity');
const querystring = require('querystring');
const NodeCache = require('node-cache');
const matchingCache = new NodeCache({ //3 hour check period, make that cache last
	checkperiod: 10800
});
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
let loc = path.dirname(require.main.filename) + '/synonyms.db';
logger.log('Synonym DB: ', loc);
var db;
try {
	db = new sqlite3.Database(loc, sqlite3.OPEN_READONLY);
}
catch(err) {
	logger.warn('db won\'t be available, couldn\'t find .db file at ',loc);
	db = null;
}

// Anime APIs
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const ANILIST = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const Kitsu = require('kitsu');
const kitsu = new Kitsu();

// Custom enums
const DataSource = require('./enums').DataSource;
const MalMediaTypeMap = require('./enums').MalMediaTypeMap;
const MalStatusMap = require('./enums').MalStatusMap;
const AnilistStatusMap = require('./enums').AnilistStatusMap;
const AnilistMediaTypeMap = require('./enums').AnilistMediaTypeMap;
const KitsuStatusMap = require('./enums').KitsuStatusMap;
const KitsuMediaTypeMap = require('./enums').KitsuMediaTypeMap;

// Custom classes
const Resolved = require('./classes/Resolved');
const Rejected = require('./classes/Rejected');
const Anime = require('./classes/Anime');
const Hyperlinks = require('./classes/Hyperlinks');
const Synonyms = require('./classes/Synonyms');
const Genres = require('./classes/Genres');

_.searchAllAnime = (query, query_format) => {
	return new Promise((resolve, reject) => {
		_.matchFromCache('{'+query+'}').then((result) => {
			resolve(result);
		}).catch((err) => {
			logger.warn('cache empty: ', err);
			//nothing in cache
			_.matchAnimeFromDatabase(query).then((result) => {
				resolve(result);
			}).catch((err) => {
				logger.warn('database empty: ', err);
				//nothing in database
				_.searchAnimes(query).then((result) => {
					resolve(result)
				}).catch((r) => {
					reject(r)
				});
			});
		});
	});
}

_.searchAllManga = (query, MangaOrLN) => {
	return new Promise((resolve, reject) => {
		if(MangaOrLN !== 'Manga' && MangaOrLN !== 'LN') {
			reject('supply MangaOrLN, no ifs ands or buts! supplied: '+MangaOrLN);
		}

		let queryf;
		if(MangaOrLN === 'Manga') {
			queryf = '<'+query+'>';
		}
		else {
			queryf = ']'+query+'[';
		}

		_.matchFromCache(queryf).then((result) => {
			resolve(result)
		}).catch((err) => {
			logger.warn('cache empty: ', err);
			//nothing in cache
			_.matchMangaFromDatabase(query, MangaOrLN).then((result) => {
				resolve(result);
			}).catch((err) => {
				logger.warn('database empty: ', err);
				//nothing in database
				_.searchManga(query, MangaOrLN).then((result) => {
					resolve(result);
				}).catch((r) => {
					reject(r);
				});
			});
		});
	});
}

_.searchAnimes = (query, query_format) => {
	//logger.log('searchAnimes() with \'', query, '\'');
	return new Promise((resolve, reject) => {
		var promises = [];
		/*
		Start an asynchonous search for one anime service
		Using the Resolved and Rejected class, we'll make our promises
		more identifying with an Enum. This also gives us flexibility
		on WHEN or HOW to resolve instead of passing the data outright.
		This middleware is ONLY intended to brand the data via the
		Resolve and Rejected classes. Further data mangling will be
		done later. When all Promises resolve, we'll have all our
		data in a neat array, and we'll maximize asynchonous
		performance.
		*/

		// Dont even try MyAnimeList: https://github.com/erengy/taiga/issues/588
		/* promises.push(new Promise((resolve, reject) => {
			//Queries MAL
			MAL.searchAnimes(query).then((results) => {
				resolve(new Resolved(DataSource.MAL, results));
			}).catch((err) => {
				logger.ind().log('mal error caught');
				//"resolving an error is a good idea" -Austin, August 4, 2017
				resolve(new Rejected(DataSource.MAL, err));
			});
		}));
		*/

		promises.push(new Promise((resolve, reject) => {
			//Queries ANILIST
			//GET: {series_type}/search/{query}
			//attempt to make the query url friendly by removing all slashes and encoding
			//other punctuation
			ANILIST.get('anime/search/' + encodeURIComponent(query.replace(new RegExp('/', 'g'), ''))).then((results) => {
				resolve(new Resolved(DataSource.ANILIST, results));
			}).catch((err) => {
				logger.ind().log('anilist error caught');
				//"resolving an error is a good idea" -Austin, August 4, 2017
				resolve(new Rejected(DataSource.ANILIST, err));
			});
		}));
		promises.push(new Promise((resolve, reject) => {
			//Queries KITSU
			kitsu.get('anime', {
				filter: {
					text: query
				}
			}).then((response) => {
				resolve(new Resolved(DataSource.KITSU, response));
			}).catch((err) => {
				logger.ind().log('kitsu error caught');
				//"resolving an error is a good idea" -Austin, August 4, 2017
				resolve(new Rejected(DataSource.KITSU, err)); //something needs to be done around here
			});
		}));
		Promise.all(promises).then((ResolvedArray) => {

			//Removes all instances of Rejected (catch the "resolved" errors)
			for(let i in ResolvedArray) {
				if(ResolvedArray[i] instanceof Rejected) {
					logger.ind().error(ResolvedArray[i]['DataSource'],' error caught: ',ResolvedArray[i]['data'])
					ResolvedArray.splice(i,1);
				}
			}
			if(ResolvedArray.length === 0) {
				throw 'insufficient results: ResolvedArray empty';
			}

			/*

			when this is called, the Promise.all will receive,
			essentially, a matrix of search results.

			the challenges that come across here:
			1) which result(s) across multiple is the intended one (s)
			2) how can we connect results between DataSources such that
			and anime isn't picked on one DataSource and its OVA picked
			on another

			pseudocode:
			- var = bestMatch(query,[all results])
			(this is assumed to be the real title)
			- var best_match_from_every_source = bestMatch(assumed_real_title, [all results])
			- consolidate(best_match_from_every_source[0],
			best_match_from_every_source[1])
			- woot you have an anime object, now send that shit off

			*/

			var best_match = {}; //dictionary
			var anime_arrays = {}; //dictionary
			//Put empty arrays inside of anime_arrays for every DataSource
			for (let e in DataSource) {
				anime_arrays[DataSource[e]] = [];
			}
			/*
			Store search results into anime objects, from their proper tags
			per DataSource
			*/
			for (let r in ResolvedArray) {
				if (ResolvedArray[r].DataSource === DataSource.MAL) {
					//confirm there were results
					if (ResolvedArray[r].data[0] !== null) {
						for (let c in ResolvedArray[r].data) {
							//ResolvedArray[r].data[c] is the object
							let a_result = ResolvedArray[r].data[c];
							//logger.log(a_result);
							let temp_dict = {};
							temp_dict[ResolvedArray[r].DataSource] = 'https://myanimelist.net/anime/' + a_result['id'];
							let img_dict = {};
							img_dict[ResolvedArray[r].DataSource] = a_result['image'];
							anime_arrays[ResolvedArray[r].DataSource].push(new Anime({
								MAL_ID: a_result['id'],
								title_romaji: a_result['title'],
								title_english: a_result['english'],
								hyperlinks: new Hyperlinks(temp_dict),
								mal_score: a_result['score'],
								media_type: MalMediaTypeMap[a_result['type']],
								status: MalStatusMap[a_result['status']],
								episode_count: a_result['episodes'],
								synopsis_full: a_result['synopsis'],
								start_date: a_result['start_date'],
								end_date: a_result['end_date'],
								image: a_result['image'],
								images: new Hyperlinks(img_dict),
								synonyms: new Synonyms(a_result['synonyms']),
								original_query: query
							}));
						}
					} else {
						//mal returned no results
						logger.warn('mal returned no results');
					}
				} else if (ResolvedArray[r].DataSource === DataSource.ANILIST) {
					//confirm there were results
					if (typeof ResolvedArray[r].data['error'] !== 'object') {
						for (let c in ResolvedArray[r].data) {
							//ResolvedArray[r].data[c] is the object
							let a_result = ResolvedArray[r].data[c];
							//logger.log(a_result);
							let temp_dict = {};
							temp_dict[ResolvedArray[r].DataSource] = 'https://anilist.co/anime/' + a_result['id'] + '/';
							let img_dict = {};
							img_dict[ResolvedArray[r].DataSource] = a_result['image_url_lge'];
							
							let some_anime = new Anime({
								ANILIST_ID: a_result['id'],
								title_romaji: a_result['title_romaji'],
								title_english: a_result['title_english'],
								hyperlinks: new Hyperlinks(temp_dict),
								anilist_score: a_result['average_score'],
								media_type: AnilistMediaTypeMap[a_result['type']],
								status: AnilistStatusMap[a_result['airing_status']],
								episode_count: a_result['total_episodes'],
								synopsis_full: a_result['description'],
								start_date: a_result['start_date'],
								end_date: a_result['end_date'],
								image: a_result['image_url_lge'],
								images: new Hyperlinks(img_dict),
								nsfw: a_result['adult'], //confirmed bool 👍
								synonyms: new Synonyms(a_result['synonyms']),
								genres: new Genres(a_result['genres']),
								original_query: query
							});
							anime_arrays[ResolvedArray[r].DataSource].push(some_anime);
						}
					} else {
						//anilist returned no results or an error
						logger.warn('anilist returned no results');
					}
				} else if (ResolvedArray[r].DataSource === DataSource.KITSU) {
					//confirm there were results (kitsu makes this so easy)
					if (ResolvedArray[r].data.meta.count > 0) {
						for (let c in ResolvedArray[r].data.data) {
							//ResolvedArray[r].data[c] is the object
							let a_result = ResolvedArray[r].data.data[c];
							//logger.log(a_result);
							let temp_dict = {};
							temp_dict[ResolvedArray[r].DataSource] = 'https://kitsu.io/anime/' + a_result['id'] + '/';
							let img_dict = {};
							img_dict[ResolvedArray[r].DataSource] = (a_result['posterImage'] === null || a_result['posterImage'] === undefined) ? undefined : a_result['posterImage']['original'];
							let synonyms_try = a_result['abbreviatedTitles'];
							if (synonyms_try === null) {
								synonyms_try = [];
							}
							if (Array.isArray(synonyms_try) && typeof a_result['canonicalTitle'] === 'string') {
								synonyms_try = synonyms_try.concat([a_result['canonicalTitle']]);
							}

							// logger.log('title: ',a_result['title']);
							// logger.log('en: ', a_result['titles']['en']);
							// logger.log('en_us: ', a_result['titles']['en_us']);
							// logger.log('OR: ', a_result['titles']['en'] || a_result['titles']['en_us']);
							// logger.log('ALL:', a_result['titles']);

							let some_anime = new Anime({
								KITSU_ID: a_result['id'],
								title_romaji: a_result['titles']['en_jp'] || a_result['titles']['ja_jp'] || a_result['titles']['en'] || a_result['titles']['en_us'], //just fuckin put a title there, consider the title_romaji the canonical title. no telling what this will do for Kitsu recognition.
								title_english: a_result['titles']['en'] || a_result['titles']['en_us'], //for shows originating in the US??? see: https://github.com/au5ton/Roboruri/issues/19
								title_japanese: a_result['titles']['ja_jp'],
								hyperlinks: new Hyperlinks(temp_dict),
								kitsu_score: a_result['averageRating'], //preserve kitsu rating AND mal score
								media_type: KitsuMediaTypeMap[a_result['subtype']],
								status: KitsuStatusMap[a_result['status']],
								episode_count: a_result['episodeCount'],
								synopsis_full: a_result['synopsis'],
								start_date: a_result['startDate'],
								end_date: a_result['endDate'],
								image: (a_result['posterImage'] === null || a_result['posterImage'] === undefined) ? undefined : a_result['posterImage']['original'],
								images: new Hyperlinks(img_dict),
								nsfw: a_result['nsfw'], //confirmed bool 👍
								synonyms: new Synonyms(synonyms_try), //maybe this'll be good enough, please work ^
								original_query: query
							});
							//logger.log(some_anime);
							anime_arrays[ResolvedArray[r].DataSource].push(some_anime);
						}
					} else {
						//anilist returned no results or an error
						logger.warn('kitsu returned no results');
					}
				}
			}

			/*
			Calculate the best match for the query by:
			- grab all titles of all formats
			- find the best match for each format, independently
			- identifying which format the query most
			resembles (english, romaji, etc) by Dice score
			- reverse lookup the anime by using the title with
			the best match, with the format the query most
			resembles

			Then:

			Consolidate the best match across DataSources

			*/
			//logger.log(anime_arrays);
			//logger.ind().log('anime_arrays');
			//`r` should be the DataSource because anime_arrays is a dict
			//logger.warn('best_match before populating:',best_match);
			let sufficient_results = false;
			for (let r in anime_arrays) {
				//logger.ind().warn(r,' results:');
				if (anime_arrays[r].length === 0 || anime_arrays[r] === null || anime_arrays[r] === undefined) {
					//logger.ind().warn(r, ' has no results to offer');
				} else {
					best_match[r] = _.findBestMatchForAnimeArray(query, anime_arrays[r]);
					//logger.ind(1).success('Picked ANIMEOBJ:',best_match[r]);
					sufficient_results = true;
				}
			}
			if (!sufficient_results) {
				reject('insufficient results, has no results to offer');
			}
			//logger.warn('best_match AFTER populating:',best_match);

			//clear some space
			//logger.nl(2);
			//logger.error('------------------------------------');
			//logger.nl(1);
			//logger.log('VERY BEST CANDIDATES for query: {',query,'}');
			// for(let r in best_match) {
			//     logger.warn(r)
			//     logger.log(best_match[r].flattened.all_titles);
			// }

			/*
			Here's how comparing top results works.

			First, if the array has made it this far, we are
			guaranteed a couple things:
			- There ARE results in best_match
			- The results in best_match HAVE been compared to the query
			and have some expectation of relation to the query

			Next, we're under a couple assumptions:
			- The 'title_romaji' is the primary title
			- If the anime is something the user is interested in, it's
			99.99% going to have a romaji title
			- The 'title_romaji' under the Anime class is actually holding
			the result's title in romaji format
			- An anime's 'title_romaji' is relatively standardized, meaning
			that the 'title_romaji' from one site won't vary from another site,
			other than maybe capitalization or some extra whitespace
			accidentally put at the beginning or end of a string. We can make
			this inference because some animes (like `K-On!`) are differentiated
			by very subtle changes in title_romaji, such as punctuation.
			The Japanese are strict about titles?
			- Because some animes (like `K-On!`) are differentiated
			by very subtle changes in title_romaji, such as punctuation, we
			cannot compare the top results using stringSimilarity, as we might
			catch the wrong season.
			- Some breaking to this rule might be 'Kiss X Sis', where the title
			is technically exactly the same between OVA and TV (or S1 or S2,
			depending on how you look at it), but the anime database listing
			could vary to differentiate to the audience with an unofficial name.
			For cases like this, comparing the media_type (TV, OVA, etc)
			should suffice.
			- If you want something with the same title released
			on the same media_type multiple times, dude, just Google it.
			Give my bot a break.

			So, exactly matching a result between databases should
			look something like:

			a.title_romaji.toLowerCase().trim() === b.title_romaji.toLowerCase().trim()
			&&
			a.media_type === b.media_type
			*/
			let SuperART; //Super Assumed Real Title (format = romaji)
			let topRomaji = [];
			let romaji_to_media_dict = [];
			let sufficient_results_other = false;
			var very_best_match = new Anime();
			//Gather all romaji titles if available
			for (let r in best_match) {
				if (best_match[r].flattened.title_romaji !== null) {
					sufficient_results_other = true;
					topRomaji.push(best_match[r].title_romaji);
					//uses the unique romaji titles to make getting the media_type easier from a Dice's Coefficient easier
					romaji_to_media_dict[best_match[r].title_romaji] = best_match[r].media_type;
				} else {
					//fuck this shit, there's no title
				}
			}
			//Reject if we've somehow made it this far without romaji titles
			if (!sufficient_results_other) {
				//how tf does this even happen
				reject('insufficient results: no romaji titles to compare');
			}
			//Assign SuperART
			SuperART = stringSimilarity.findBestMatch(query, topRomaji);
			SuperARTMediaType = romaji_to_media_dict[SuperART['bestMatch']['target']];

			//Reverse search with SuperART to consolidate results
			for (let r in best_match) {
				if (best_match[r].flattened.title_romaji !== null) {
					//because SuperART is literally from best_match,
					//there should be at least one instance in very_best_match

					//previously I described matching with media_type in addition, but
					//until I standardize media_type in the Anime object, I can't do that
					//TO BE IMPLEMENTED
					if (SuperART['bestMatch']['target'].toLowerCase().trim() === best_match[r].flattened.title_romaji.toLowerCase().trim() && SuperARTMediaType === best_match[r].flattened.media_type) {
						//media_type is standardized, so it is safe to confirm that a show and movie aren't being mushed together
						very_best_match = Anime.consolidate(very_best_match, best_match[r]);
					} else {
						logger.warn('`', best_match[r].flattened.title_romaji, '` ('+r+') was NOT CONSOLIDATED with `', SuperART['bestMatch']['target'], '`');
						logger.warn('why? title match: ',SuperART['bestMatch']['target'].toLowerCase().trim() === best_match[r].flattened.title_romaji.toLowerCase().trim(), ', media_type match: ',SuperARTMediaType === best_match[r].flattened.media_type);
						logger.warn(best_match[r].flattened.media_type, ' versus ', SuperARTMediaType);
					}
				} else {
					//this is confirmed by the previous loop not to happen
					reject('insufficient results: LOGIC ERROR');
				}
			}

			//logger.nl(1);
			//logger.error('------------------------------------');
			//logger.nl(2);

			//very_best_match is an anime object, now we have to populate a couple of last-minute things
			//logger.log(very_best_match.status)
			if(very_best_match.status === 'Currently Airing' && very_best_match.flattened.ANILIST_ID !== null) {
				//grab some info
				ANILIST.get('anime/'+very_best_match.ANILIST_ID).then((results) => {
					if(results['airing'] !== undefined) {

						//append some last-minute info
						very_best_match.next_episode_number = results['airing']['next_episode'];
						very_best_match.next_episode_countdown = results['airing']['countdown'];

						logger.log('search: {' + query + '} => ' + very_best_match.flattened.title);

						//issue #51: dont cache the query if its currently airing, info subject to change (especially airtime)
						//matchingCache.set('{'+query.toLowerCase()+'}', very_best_match.flattened);

						//THIS IS WHAT IT ALL BOILS DOWN TO
						resolve(very_best_match.flattened);
					}
				}).catch((err) => {
					logger.warn('failed to append airing info: ', err);
					logger.log('search: {' + query + '} => ' + very_best_match.flattened.title);

					//issue #51: dont cache the query if its currently airing, info subject to change (especially airtime)
					//matchingCache.set('{'+query.toLowerCase()+'}', very_best_match.flattened);

					//THIS IS WHAT IT ALL BOILS DOWN TO
					resolve(very_best_match.flattened);
				});
			}
			else {
				logger.log('search: {' + query + '} => ' + very_best_match.flattened.title);
				matchingCache.set('{'+query.toLowerCase()+'}', very_best_match.flattened);
				//THIS IS WHAT IT ALL BOILS DOWN TO
				resolve(very_best_match.flattened);
			}

		}).catch((Rejected) => {
			//err occured
			reject(Rejected)
		});
	});
};

_.searchManga = (query, MangaOrLN) => {
	if(MangaOrLN !== 'Manga' && MangaOrLN !== 'LN') {
		throw 'supply MangaOrLN, no ifs ands or buts! supplied: '+MangaOrLN;
	}
	//logger.log('searchAnimes() with \'', query, '\'');
	return new Promise((resolve, reject) => {
		var promises = [];

		// Dont even try MyAnimeList: https://github.com/erengy/taiga/issues/588
		/*promises.push(new Promise((resolve, reject) => {
			//Queries MAL
			MAL.searchMangas(query).then((results) => {
				resolve(new Resolved(DataSource.MAL, results));
			}).catch((err) => {
				logger.ind().log('mal error caught');
				//"resolving an error is still a good idea" -Austin, July 5, 2018
				resolve(new Rejected(DataSource.MAL, err));
			});
		}));*/


		promises.push(new Promise((resolve, reject) => {
			//Queries ANILIST
			ANILIST.get('manga/search/' + encodeURIComponent(query.replace(new RegExp('/', 'g'), ''))).then((results) => {
				resolve(new Resolved(DataSource.ANILIST, results));
			}).catch((err) => {
				logger.ind().log('anilist error caught');
				//"resolving an error is still a good idea" -Austin, July 5, 2018
				resolve(new Rejected(DataSource.ANILIST, err));
			});
		}));
		promises.push(new Promise((resolve, reject) => {
			//Queries KITSU
			if(MangaOrLN === 'Manga') {
				kitsu.get('manga', {
					filter: {
						text: query
					}
				}).then((response) => {
					resolve(new Resolved(DataSource.KITSU, response));
				}).catch((err) => {
					logger.ind().log('kitsu error caught');
					//"resolving an error is still a good idea" -Austin, July 5, 2018
					resolve(new Rejected(DataSource.KITSU, err));
				});
			}
			else if(MangaOrLN === 'LN') {
				kitsu.get('manga', {
					filter: {
						text: query,
						subtype: 'novel'
					}
				}).then((response) => {
					resolve(new Resolved(DataSource.KITSU, response));
				}).catch((err) => {
					logger.ind().log('kitsu error caught');
					//"resolving an error is still a good idea" -Austin, July 5, 2018
					resolve(new Rejected(DataSource.KITSU, err));
				});
			}
		}));
		Promise.all(promises).then((ResolvedArray) => {
			
			//Removes all instances of Rejected (catch the "resolved" errors)
			for(let i in ResolvedArray) {
				if(ResolvedArray[i] instanceof Rejected) {
					logger.ind().error(ResolvedArray[i]['DataSource'],' error caught: ',ResolvedArray[i]['data'])
					ResolvedArray.splice(i,1);
				}
			}
			if(ResolvedArray.length === 0) {
				throw 'insufficient results: ResolvedArray empty';
			}

			
			var best_match = {}; //dictionary
			var anime_arrays = {}; //dictionary

			function no_volumes(whatever) {
				return String(whatever) === '0' || String(whatever) === 'undefined' || String(whatever) === 'null';
			}

			//Put empty arrays inside of anime_arrays for every DataSource
			for (let e in DataSource) {
				anime_arrays[DataSource[e]] = [];
			}
			for (let r in ResolvedArray) {
				if (ResolvedArray[r].DataSource === DataSource.MAL) {
					//confirm there were results
					if (ResolvedArray[r].data[0] !== null) {
						for (let c in ResolvedArray[r].data) {
							//ResolvedArray[r].data[c] is the object
							let a_result = ResolvedArray[r].data[c];
							let temp_dict = {};
							temp_dict[ResolvedArray[r].DataSource] = 'https://myanimelist.net/manga/' + a_result['id'];
							let img_dict = {};
							img_dict[ResolvedArray[r].DataSource] = a_result['image'];
							anime_arrays[ResolvedArray[r].DataSource].push(new Anime({
								title_romaji: a_result['title'],
								title_english: a_result['english'],
								hyperlinks: new Hyperlinks(temp_dict),
								mal_score: a_result['score'],
								media_type: MalMediaTypeMap[a_result['type']],
								status: MalStatusMap[a_result['status']],
								volumes: no_volumes(a_result['volumes']) ? 'Unknown' : a_result['volumes'],
								chapters: no_volumes(a_result['chapters']) === '0' ? 'Unknown' : a_result['chapters'],
								synopsis_full: a_result['synopsis'],
								start_date: a_result['start_date'],
								end_date: a_result['end_date'],
								image: a_result['image'],
								images: new Hyperlinks(img_dict),
								synonyms: new Synonyms(a_result['synonyms']),
								original_query: query
							}));
						}
					} else {
						//mal returned no results
						logger.warn('mal returned no results');
					}
				} else if (ResolvedArray[r].DataSource === DataSource.ANILIST) {
					//confirm there were results
					if (typeof ResolvedArray[r].data['error'] !== 'object') {
						for (let c in ResolvedArray[r].data) {
							//ResolvedArray[r].data[c] is the object
							let a_result = ResolvedArray[r].data[c];
							let temp_dict = {};
							temp_dict[ResolvedArray[r].DataSource] = 'https://anilist.co/manga/' + a_result['id'] + '/';
							let img_dict = {};
							img_dict[ResolvedArray[r].DataSource] = a_result['image_url_lge'];
							let some_anime = new Anime({
								title_romaji: a_result['title_romaji'],
								title_english: a_result['title_english'],
								hyperlinks: new Hyperlinks(temp_dict),
								anilist_score: a_result['average_score'],
								media_type: AnilistMediaTypeMap[a_result['type']],
								status: AnilistStatusMap[a_result['publishing_status']],
								volumes: no_volumes(a_result['total_volumes']) ? 'Unknown' : a_result['total_volumes'],
								chapters: no_volumes(a_result['total_chapters']) ? 'Unknown' : a_result['total_chapters'],
								synopsis_full: a_result['description'],
								start_date: a_result['start_date_fuzzy'],
								end_date: a_result['end_date_fuzzy'],
								image: a_result['image_url_lge'],
								images: new Hyperlinks(img_dict),
								nsfw: a_result['adult'], //confirmed bool 👍
								synonyms: new Synonyms(a_result['synonyms']),
								genres: new Genres(a_result['genres']),
								original_query: query
							});
							anime_arrays[ResolvedArray[r].DataSource].push(some_anime);
						}
					} else {
						//anilist returned no results or an error
						logger.warn('anilist returned no results');
					}
				} else if (ResolvedArray[r].DataSource === DataSource.KITSU) {
					//confirm there were results (kitsu makes this so easy)
					if (ResolvedArray[r].data.meta.count > 0) {
						for (let c in ResolvedArray[r].data.data) {
							//ResolvedArray[r].data[c] is the object
							let a_result = ResolvedArray[r].data.data[c];
							let temp_dict = {};
							temp_dict[ResolvedArray[r].DataSource] = 'https://kitsu.io/manga/' + a_result['id'] + '/';
							let img_dict = {};
							img_dict[ResolvedArray[r].DataSource] = (a_result['posterImage'] === null || a_result['posterImage'] === undefined) ? undefined : a_result['posterImage']['original'];
							let synonyms_try = a_result['abbreviatedTitles'];
							if (synonyms_try === null) {
								synonyms_try = [];
							}
							if (Array.isArray(synonyms_try) && typeof a_result['canonicalTitle'] === 'string') {
								synonyms_try = synonyms_try.concat([a_result['canonicalTitle']]);
							}

							let some_anime = new Anime({
								title_romaji: a_result['titles']['en_jp'] || a_result['titles']['ja_jp'], //just fuckin put a title there, consider the title_romaji the canonical title. no telling what this will do for Kitsu recognition.
								title_english: a_result['titles']['en'] || a_result['titles']['en_us'], //for books originating in the US??? see: https://github.com/au5ton/Roboruri/issues/19
								title_japanese: a_result['titles']['ja_jp'],
								hyperlinks: new Hyperlinks(temp_dict),
								kitsu_score: a_result['averageRating'], //preserve kitsu rating AND mal score
								media_type: KitsuMediaTypeMap[a_result['subtype']],
								status: KitsuStatusMap[a_result['status']],
								volumes: no_volumes(a_result['volumeCount']) ? 'Unknown' : a_result['volumeCount'],
								chapters: no_volumes(a_result['chapterCount']) ? 'Unknown' : a_result['chapterCount'],
								synopsis_full: a_result['synopsis'],
								start_date: a_result['startDate'],
								end_date: a_result['endDate'],
								image: (a_result['posterImage'] === null || a_result['posterImage'] === undefined) ? undefined : a_result['posterImage']['original'],
								images: new Hyperlinks(img_dict),
								nsfw: a_result['nsfw'], //confirmed bool 👍
								synonyms: new Synonyms(synonyms_try), //maybe this'll be good enough, please work ^
								original_query: query
							});
							//logger.log(a_result['subtype']);
							anime_arrays[ResolvedArray[r].DataSource].push(some_anime);
						}
					} else {
						//anilist returned no results or an error
						logger.warn('kitsu returned no results');
					}
				}
			}

			//logger.log(anime_arrays);
			//logger.ind().log('anime_arrays');
			//`r` should be the DataSource because anime_arrays is a dict
			//logger.warn('best_match before populating:',best_match);
			let sufficient_results = false;
			for (let r in anime_arrays) {
				//logger.ind().warn(r,' results:');
				if (anime_arrays[r].length === 0 || anime_arrays[r] === null || anime_arrays[r] === undefined) {
					//logger.ind().warn(r, ' has no results to offer');
				} else {
					best_match[r] = _.findBestMatchForAnimeArray(query, anime_arrays[r]);
					//logger.ind(1).success('Picked ANIMEOBJ:',best_match[r]);
					sufficient_results = true;
				}
			}
			if (!sufficient_results) {
				reject('insufficient results, has no results to offer');
			}
			//logger.warn('best_match AFTER populating:',best_match);

			let SuperART; //Super Assumed Real Title (format = romaji)
			let topRomaji = [];
			let romaji_to_media_dict = [];
			let sufficient_results_other = false;
			var very_best_match = new Anime();
			//Gather all romaji titles if available
			for (let r in best_match) {
				if (best_match[r].flattened.title_romaji !== null) {
					sufficient_results_other = true;
					topRomaji.push(best_match[r].title_romaji);
					//uses the unique romaji titles to make getting the media_type easier from a Dice's Coefficient easier
					romaji_to_media_dict[best_match[r].title_romaji] = best_match[r].media_type;
				} else {
					//fuck this shit, there's no title
				}
			}
			//Reject if we've somehow made it this far without romaji titles
			if (!sufficient_results_other) {
				//how tf does this even happen
				reject('insufficient results: no romaji titles to compare');
			}
			//Assign SuperART
			SuperART = stringSimilarity.findBestMatch(query, topRomaji);
			SuperARTMediaType = romaji_to_media_dict[SuperART['bestMatch']['target']];

			//Reverse search with SuperART to consolidate results
			for (let r in best_match) {
				if (best_match[r].flattened.title_romaji !== null) {
					//because SuperART is literally from best_match,
					//there should be at least one instance in very_best_match
					if (SuperART['bestMatch']['target'].toLowerCase().trim() === best_match[r].flattened.title_romaji.toLowerCase().trim() && SuperARTMediaType === best_match[r].flattened.media_type) {
						very_best_match = Anime.consolidate(very_best_match, best_match[r]);
					} else {
						logger.warn('`', best_match[r].flattened.title_romaji, '` ('+r+') was NOT CONSOLIDATED with `', SuperART['bestMatch']['target'], '`');
						logger.warn('why? title match: ',SuperART['bestMatch']['target'].toLowerCase().trim() === best_match[r].flattened.title_romaji.toLowerCase().trim(), ', media_type match: ',SuperARTMediaType === best_match[r].flattened.media_type);
						logger.warn(best_match[r].flattened.media_type, ' versus ', SuperARTMediaType);
					}
				} else {
					//this is confirmed by the previous loop not to happen
					reject('insufficient results: LOGIC ERROR');
				}
			}

			if(MangaOrLN === 'Manga') {
				logger.log('search: <' + query + '> => ' + very_best_match.flattened.title);
				matchingCache.set('<'+query+'>', very_best_match.flattened);
			}
			else if(MangaOrLN === 'LN') {
				logger.log('search: ]' + query + '[ => ' + very_best_match.flattened.title);
				matchingCache.set(']'+query+'[', very_best_match.flattened);
			}
			//THIS IS WHAT IT ALL BOILS DOWN TO
			resolve(very_best_match.flattened);

		}).catch((Rejected) => {
			//err occured
			reject(Rejected)
		});
	});
};

// Receives: query string, array of Anime instances
// Returns: Anime instance (or more specifically: objects with at least 1 of the 3 titles)
_.findBestMatchForAnimeArray = (query, animes) => {

	/*
	Get just titles for all formats for all animes
	*/
	let just_titles_romaji = [];
	let just_titles_english = [];
	let just_titles_japanese = [];
	let just_synonyms = [];
	for (let i in animes) {
		//logger.ind(1).log(i,' index');
		if (animes[i].flattened['title_romaji'] !== null) {
			//logger.ind(2).log('r:`',animes[i]['title_romaji'],'`');
			just_titles_romaji.push(animes[i]['title_romaji']);
		}
		if (animes[i].flattened['title_english'] !== null) {
			//logger.ind(2).log('e:`',animes[i]['title_romaji'],'`');
			just_titles_english.push(animes[i]['title_english']);
		}
		if (animes[i].flattened['title_japanese'] !== null) {
			//logger.ind(2).log('j:`',animes[i]['title_romaji'],'`');
			just_titles_japanese.push(animes[i]['title_japanese']);
		}
		if (animes[i].flattened['synonyms'] !== null) {
			//logger.ind(2).log('syn:`',animes[i]['synonyms'].array,'`');
			just_synonyms = just_synonyms.concat(animes[i]['synonyms'].array);
		}
	}

	/*
	Compare Dice rating across formats
	*/

	//best match romaji
	let bmr = null;
	if (just_titles_romaji.length > 0) {
		bmr = stringSimilarity.findBestMatch(query, just_titles_romaji);
		//logger.ind(2).log('bmr:',bmr);
	}
	//best match english
	let bme = null;
	if (just_titles_english.length > 0) {
		bme = stringSimilarity.findBestMatch(query, just_titles_english);
		//logger.ind(2).log('bme:',bme);
	}
	//best match japanese
	let bmj = null;
	if (just_titles_japanese.length > 0) {
		bmj = stringSimilarity.findBestMatch(query, just_titles_japanese);
		//logger.ind(2).log('bmj:',bmj);
	}
	let bms = null;
	if (just_synonyms.length > 0) {
		bms = stringSimilarity.findBestMatch(query, just_synonyms);
		//logger.ind(2).log('bms:',bms);
	}
	let art; //assumed real title
	let art_format; //english, romaji, japanese
	//first check if we got nothin
	if (bmr === null && bme === null && bmj === null) {
		//throw 'can\'t findBestMatchForAnimeArray if there are no titles';
		/*
		above line was a mistake^
		this DOESNT throw an error so that other DataSources still get checked,
		and this (deadass) one gets consolidated.

		this means that checking for a 'no match' must be done further up the pipeline.
		*/
		return new Anime()
	}
	if (bmj === null) {
		/*
		this is so we don't have to copy and paste the If-statement monster below
		if it ain't there, the rating is -1. It will not be chosen no matter what.

		(hopefully)
		*/
		bmj = {};
		bmj['bestMatch'] = {};
		bmj['bestMatch']['rating'] = -1.0;
	}
	if (bmr === null) {
		bmr = {};
		bmr['bestMatch'] = {};
		bmr['bestMatch']['rating'] = -1.0;
	}
	if (bme === null) {
		bme = {};
		bme['bestMatch'] = {};
		bme['bestMatch']['rating'] = -1.0;
	}
	if (bms === null) {
		bms = {};
		bms['bestMatch'] = {};
		bms['bestMatch']['rating'] = -1.0;
	}

	// logger.ind(2).warn('ratings:');
	// logger.ind(3).log('bmr',bmr['bestMatch']['rating']);
	// logger.ind(3).log('bme',bme['bestMatch']['rating']);
	// logger.ind(3).log('bmj',bmj['bestMatch']['rating']);
	// logger.ind(3).log('bms',bms['bestMatch']['rating']);

	if (bme['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bme['bestMatch']['rating'] >= bmj['bestMatch']['rating'] && bme['bestMatch']['rating'] >= bms['bestMatch']['rating']) {
		//english got the best rating
		art = bme['bestMatch']['target'];
		art_format = 'english';
		//logger.ind(2).success('Picked ART with ',art_format,' (',bme['bestMatch']['rating'],'):',art);
	} else if (bmr['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bmr['bestMatch']['rating'] >= bmj['bestMatch']['rating'] && bmr['bestMatch']['rating'] >= bms['bestMatch']['rating']) {
		//romaji got the best rating
		art = bmr['bestMatch']['target'];
		art_format = 'romaji';
		//logger.ind(2).success('Picked ART with ',art_format,' (',bmr['bestMatch']['rating'],'):',art);
	} else if (bmj['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bmj['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bmj['bestMatch']['rating'] >= bms['bestMatch']['rating']) {
		//japanese got the best rating
		art = bmj['bestMatch']['target'];
		art_format = 'japanese';
		//logger.ind(2).success('Picked ART with ',art_format,' (',bmj['bestMatch']['rating'],'):',art);
	} else if (bms['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bms['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bms['bestMatch']['rating'] >= bmj['bestMatch']['rating']) {
		//japanese got the best rating
		art = bms['bestMatch']['target'];
		art_format = 'synonym';
	}

	/*
	Use ART and ART format to reverse lookup the anime search result
	*/
	for (let i in animes) {
		if (art_format === 'english') {
			if (art === animes[i]['title_english']) {
				//found the anime
				return animes[i];
			}
		} else if (art_format === 'romaji') {
			if (art === animes[i]['title_romaji']) {
				//found the anime
				return animes[i];
			}
		} else if (art_format === 'japanese') {
			if (art === animes[i]['title_japanese']) {
				//found the anime
				return animes[i];
			}
		} else if (art_format === 'synonym') {
			for (let n = 0; n < animes[i]['synonyms'].array.length; n++) {
				if (art === animes[i]['synonyms'].array[n]) {
					//found the anime
					return animes[i];
				}
			}
		}
	}

};

/*
Row format:
{ name: 'slang name',
type: 'Anime', //or 'Manga' or 'LN'
dbLinks: (JSON string, needs parsing)
{
"mal": ["real title",12345]
"hb": "slug-name-here",
"ani": 12345,
"adb": "12345",
"ap": "slug-name-here"
}
}
*/

_.matchAnimeFromDatabase = (query) => {
	return new Promise((resolve, reject) => {
		if(db === null) {
			reject('db failed to initialize.');
		}
		db.serialize(() => {
			let found_in_db = false;
			db.each('SELECT name, dbLinks from synonyms WHERE type = \'Anime\'', (err, row) => {
				//callback for each row
				if (err) throw err;
				if (query.toLowerCase() === row.name.toLowerCase()) {
					found_in_db = true;
					//grab info about the anime
					let dbLinks = JSON.parse(row.dbLinks);
					var promises = [];
					//logger.log(dbLinks);

					/*
					Start an asynchonous snatching of all info from multiple anime services
					*/
					if(dbLinks['mal'] !== undefined && dbLinks['mal'][0] !== '') {
						
						// Dont even try MyAnimeList: https://github.com/erengy/taiga/issues/588
						/*promises.push(new Promise((resolve, reject) => {
							//Queries MAL, 0th index is the title, 1st index is the id
							MAL.searchAnimes(dbLinks['mal'][0]).then((results) => {
								resolve(new Resolved(DataSource.MAL, results));
							}).catch((err) => {
								logger.ind().log('mal error caught');
								reject(new Rejected(DataSource.MAL, err));
							});
						}));*/


					}
					if(dbLinks['ani'] !== undefined && dbLinks['ani'] !== '') {
						promises.push(new Promise((resolve, reject) => {
							//Queries ANILIST
							//GET: anime/{id}
							ANILIST.get('anime/' + dbLinks['ani']).then((results) => {
								resolve(new Resolved(DataSource.ANILIST, results));
							}).catch((err) => {
								logger.ind().log('anilist error caught');
								reject(new Rejected(DataSource.ANILIST, err));
							});
						}));
					}
					if(dbLinks['hb'] !== undefined && dbLinks['hb'] !== '') {
						promises.push(new Promise((resolve, reject) => {
							//Queries KITSU
							kitsu.get('anime', {
								filter: {
									slug: dbLinks['hb']
								}
							}).then((response) => {
								resolve(new Resolved(DataSource.KITSU, response));
							}).catch((err) => {
								logger.ind().log('kitsu error caught');
								reject(new Rejected(DataSource.KITSU, err));
							});
						}));
					}
					Promise.all(promises).then((ResolvedArray) => {
						//we got a bunch of search results
						var the_anime = new Anime(); //an empty anime object to consolidate others to
						/*
						Store search results into anime objects, from their proper tags
						per DataSource
						*/
						for (let r in ResolvedArray) {
							if (ResolvedArray[r].DataSource === DataSource.MAL) {
								//confirm there were results
								if (ResolvedArray[r].data[0] !== null) {
									for (let c in ResolvedArray[r].data) {
										//ResolvedArray[r].data[c] is the object
										let a_result = ResolvedArray[r].data[c];
										if(String(a_result['id']) === String(dbLinks['mal'][1])) {
											//logger.log('found a MAL result with the intended id');
											let temp_dict = {};
											temp_dict[ResolvedArray[r].DataSource] = 'https://myanimelist.net/anime/' + a_result['id'];
											let img_dict = {};
											img_dict[ResolvedArray[r].DataSource] = a_result['image'];

											the_anime = Anime.consolidate(new Anime({
												title_romaji: a_result['title'],
												title_english: a_result['english'],
												hyperlinks: new Hyperlinks(temp_dict),
												mal_score: a_result['score'],
												media_type: MalMediaTypeMap[a_result['type']],
												status: MalStatusMap[a_result['status']],
												episode_count: a_result['episodes'],
												synopsis_full: a_result['synopsis'],
												start_date: a_result['start_date'],
												end_date: a_result['end_date'],
												image: a_result['image'],
												images: new Hyperlinks(img_dict),
												synonyms: new Synonyms(a_result['synonyms']),
												original_query: query
											}), the_anime);
										}
									}
								} else {
									//mal returned no results
									logger.warn('mal returned no results');
								}
							} else if (ResolvedArray[r].DataSource === DataSource.ANILIST) {
								//confirm there were results
								if (typeof ResolvedArray[r].data['error'] !== 'object') {
									let a_result = ResolvedArray[r].data;
									let temp_dict = {};
									temp_dict[ResolvedArray[r].DataSource] = 'https://anilist.co/anime/' + a_result['id'] + '/';
									let img_dict = {};
									img_dict[ResolvedArray[r].DataSource] = a_result['image_url_lge'];

									let some_anime = new Anime({
										title_romaji: a_result['title_romaji'],
										title_english: a_result['title_english'],
										hyperlinks: new Hyperlinks(temp_dict),
										anilist_score: a_result['average_score'],
										media_type: AnilistMediaTypeMap[a_result['type']],
										status: AnilistStatusMap[a_result['airing_status']],
										episode_count: a_result['total_episodes'],
										synopsis_full: a_result['description'],
										start_date: a_result['start_date_fuzzy'],
										end_date: a_result['end_date_fuzzy'],
										image: a_result['image_url_lge'],
										images: new Hyperlinks(img_dict),
										nsfw: a_result['adult'], //confirmed bool 👍
										synonyms: new Synonyms(a_result['synonyms']),
										genres: new Genres(a_result['genres']),
										original_query: query
									});
									the_anime = Anime.consolidate(the_anime, some_anime);

								} else {
									//anilist returned no results or an error
									logger.warn('anilist returned no results');
								}
							} else if (ResolvedArray[r].DataSource === DataSource.KITSU) {
								//confirm there were results (kitsu makes this so easy)
								if (ResolvedArray[r].data.meta.count > 0) {
									for (let c in ResolvedArray[r].data.data) {
										//ResolvedArray[r].data[c] is the object
										let a_result = ResolvedArray[r].data.data[c];
										let temp_dict = {};
										temp_dict[ResolvedArray[r].DataSource] = 'https://kitsu.io/anime/' + a_result['id'] + '/';
										let synonyms_try = a_result['abbreviatedTitles'];
										if (synonyms_try === null) {
											synonyms_try = [];
										}
										if (Array.isArray(synonyms_try) && typeof a_result['canonicalTitle'] === 'string') {
											synonyms_try = synonyms_try.concat([a_result['canonicalTitle']]);
										}

										let img_dict = {};
										img_dict[ResolvedArray[r].DataSource] = a_result['posterImage']['original'];

										// logger.log('title: ',a_result['title']);
										// logger.log('en: ', a_result['titles']['en']);
										// logger.log('en_us: ', a_result['titles']['en_us']);
										// logger.log('OR: ', a_result['titles']['en'] || a_result['titles']['en_us']);
										// logger.log('ALL:', a_result['titles']);

										let some_anime = new Anime({
											title_romaji: a_result['titles']['en_jp'] || a_result['titles']['ja_jp'] || a_result['titles']['en'] || a_result['titles']['en_us'], //just fuckin put a title there, consider the title_romaji the canonical title. no telling what this will do for Kitsu recognition.
											title_english: a_result['titles']['en'] || a_result['titles']['en_us'], //for shows originating in the US??? see: https://github.com/au5ton/Roboruri/issues/19
											title_japanese: a_result['titles']['ja_jp'],
											hyperlinks: new Hyperlinks(temp_dict),
											kitsu_score: a_result['averageRating'], //preserve kitsu rating AND mal score
											media_type: KitsuMediaTypeMap[a_result['showType']],
											status: KitsuStatusMap[a_result['status']],
											episode_count: a_result['episodeCount'],
											synopsis_full: a_result['synopsis'],
											start_date: a_result['startDate'],
											end_date: a_result['endDate'],
											image: a_result['posterImage']['original'],
											images: new Hyperlinks(img_dict),
											nsfw: a_result['nsfw'], //confirmed bool 👍
											synonyms: new Synonyms(synonyms_try), //maybe this'll be good enough, please work ^
											original_query: query
										});
										the_anime = Anime.consolidate(the_anime, some_anime);
									}
								} else {
									//anilist returned no results or an error
									logger.warn('kitsu returned no results');
								}
							}
						}

						//the_anime is the correct anime, no sorting matching bullshit left to do :D
						logger.log('database: {' + query + '} => ' + the_anime.flattened.title);
						matchingCache.set(query.toLowerCase(), the_anime.flattened);
						//THIS IS WHAT IT ALL BOILS DOWN TO
						resolve(the_anime.flattened);
					}).catch((Rejected) => {
						//err occured
						logger.error('what the hell, why is this? :\n', Rejected); //???
						reject(Rejected)
					});
				}

			}, (err, numOfRows) => {
				//complete call back, when database query completes
				if(err) throw err;
				if(!found_in_db) {
					reject('couldn\'t find that name in the database');
				}
			});
		});

	});
};

_.matchMangaFromDatabase = (query, MangaOrLN) => {
	if(MangaOrLN !== 'Manga' && MangaOrLN !== 'LN') {
		throw 'supply MangaOrLN, no ifs ands or buts! supplied: '+MangaOrLN;
	}
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			let found_in_db = false;
			db.each('SELECT name, dbLinks from synonyms WHERE type = \''+MangaOrLN+'\'', (err, row) => {
				//callback for each row
				if (err) throw err;
				if (query.toLowerCase() === row.name.toLowerCase()) {
					found_in_db = true;
					//grab info about the anime
					let dbLinks = JSON.parse(row.dbLinks);
					var promises = [];
					//logger.log('dbLinks: ', dbLinks);

					/*
					Start an asynchonous snatching of all info from multiple anime services
					*/
					if(dbLinks['mal'] !== undefined && dbLinks['mal'][0] !== '') {
						
						// Dont even try MyAnimeList: https://github.com/erengy/taiga/issues/588
						/*promises.push(new Promise((resolve, reject) => {
							//Queries MAL, 0th index is the title, 1st index is the id
							MAL.searchMangas(dbLinks['mal'][0]).then((results) => {
								resolve(new Resolved(DataSource.MAL, results));
							}).catch((err) => {
								logger.ind().log('mal error caught');
								reject(new Rejected(DataSource.MAL, err));
							});
						}));*/


					}
					if(dbLinks['ani'] !== undefined && dbLinks['ani'] !== '') {
						promises.push(new Promise((resolve, reject) => {
							//Queries ANILIST
							//GET: anime/{id}
							ANILIST.get('manga/' + dbLinks['ani']).then((results) => {
								resolve(new Resolved(DataSource.ANILIST, results));
							}).catch((err) => {
								logger.ind().log('anilist error caught');
								reject(new Rejected(DataSource.ANILIST, err));
							});
						}));
					}
					if(dbLinks['hb'] !== undefined && dbLinks['hb'] !== '') {
						promises.push(new Promise((resolve, reject) => {
							//Queries KITSU
							kitsu.get('manga', {
								filter: {
									slug: dbLinks['hb']
								}
							}).then((response) => {
								logger.log(response);
								resolve(new Resolved(DataSource.KITSU, response));
							}).catch((err) => {
								logger.ind().log('kitsu error caught');
								reject(new Rejected(DataSource.KITSU, err));
							});
						}));
					}
					Promise.all(promises).then((ResolvedArray) => {
						//we got a bunch of search results
						//not *technically* an Anime but all the code we wrote uses Anime objects
						//just fucking go with it, let's make this work
						var the_manga = new Anime(); //an empty anime object to consolidate others to
						function no_volumes(whatever) {
							return String(whatever) === '0' || String(whatever) === 'undefined';
						}
						/*
						Store search results into anime objects, from their proper tags
						per DataSource
						*/
						for (let r in ResolvedArray) {
							if (ResolvedArray[r].DataSource === DataSource.MAL) {
								//confirm there were results
								if (ResolvedArray[r].data[0] !== null) {
									for (let c in ResolvedArray[r].data) {
										//ResolvedArray[r].data[c] is the object
										let a_result = ResolvedArray[r].data[c];
										if(String(a_result['id']) === String(dbLinks['mal'][1])) {
											//logger.log('found a MAL result with the intended id');
											let temp_dict = {};
											temp_dict[ResolvedArray[r].DataSource] = 'https://myanimelist.net/manga/' + a_result['id'];
											if(!(dbLinks['mu'] === undefined || dbLinks['mu'] === '')) {
												//logger.warn('mu good: ',dbLinks['mu']);
												temp_dict[DataSource.MANGAUPDATES] = 'https://www.mangaupdates.com/series.html?id=' + dbLinks['mu'];
											}
											if(!(dbLinks['ap'] === undefined || dbLinks['ap'] === '')) {
												//logger.warn('ap good',dbLinks['ap']);
												temp_dict[DataSource.ANIMEPLANET] = 'https://www.anime-planet.com/manga/' + dbLinks['ap'];
											}
											let img_dict = {};
											img_dict[ResolvedArray[r].DataSource] = a_result['image'];
											//logger.log(ResolvedArray[r].DataSource,' ',a_result['volumes'],' | ',a_result['chapters']);
											the_manga = Anime.consolidate(new Anime({
												title_romaji: a_result['title'],
												title_english: a_result['english'],
												hyperlinks: new Hyperlinks(temp_dict),
												mal_score: a_result['score'],
												media_type: MalMediaTypeMap[a_result['type']],
												status: MalStatusMap[a_result['status']],
												volumes: no_volumes(a_result['volumes']) ? 'Unknown' : a_result['volumes'],
												chapters: no_volumes(a_result['chapters']) === '0' ? 'Unknown' : a_result['chapters'],
												synopsis_full: a_result['synopsis'],
												start_date: a_result['start_date'],
												end_date: a_result['end_date'],
												image: a_result['image'],
												images: new Hyperlinks(img_dict),
												synonyms: new Synonyms(a_result['synonyms'])
											}), the_manga);
										}
										//logger.log(String(a_result['id']) === String(dbLinks['mal'][1]));
									}
								} else {
									//mal returned no results
									logger.warn('mal returned no results');
								}
							} else if (ResolvedArray[r].DataSource === DataSource.ANILIST) {
								//confirm there were results
								if (typeof ResolvedArray[r].data['error'] !== 'object') {
									let a_result = ResolvedArray[r].data;
									//logger.log(ResolvedArray[r].DataSource,' ',a_result['volumes'],' | ',a_result['chapters']);
									let temp_dict = {};
									temp_dict[ResolvedArray[r].DataSource] = 'https://anilist.co/manga/' + a_result['id'] + '/';
									if(!(dbLinks['mu'] === undefined || dbLinks['mu'] === '')) {
										//logger.warn('mu good: ',dbLinks['mu']);
										temp_dict[DataSource.MANGAUPDATES] = 'https://www.mangaupdates.com/series.html?id=' + dbLinks['mu'];
									}
									if(!(dbLinks['ap'] === undefined || dbLinks['ap'] === '')) {
										//logger.warn('ap good',dbLinks['ap']);
										temp_dict[DataSource.ANIMEPLANET] = 'https://www.anime-planet.com/manga/' + dbLinks['ap'];
									}
									let img_dict = {};
									img_dict[ResolvedArray[r].DataSource] = a_result['image_url_lge'];

									let some_manga = new Anime({
										title_romaji: a_result['title_romaji'],
										title_english: a_result['title_english'],
										hyperlinks: new Hyperlinks(temp_dict),
										anilist_score: a_result['average_score'],
										media_type: AnilistMediaTypeMap[a_result['type']],
										status: AnilistStatusMap[a_result['publishing_status']],
										volumes: no_volumes(a_result['total_volumes']) ? 'Unknown' : a_result['total_volumes'],
										chapters: no_volumes(a_result['total_chapters']) ? 'Unknown' : a_result['total_chapters'],
										synopsis_full: a_result['description'],
										start_date: a_result['start_date_fuzzy'],
										end_date: a_result['end_date_fuzzy'],
										image: a_result['image_url_lge'],
										images: new Hyperlinks(img_dict),
										nsfw: a_result['adult'], //confirmed bool 👍
										synonyms: new Synonyms(a_result['synonyms']),
										genres: new Genres(a_result['genres'])
									});
									the_manga = Anime.consolidate(the_manga, some_manga);

								} else {
									//anilist returned no results or an error
									logger.warn('anilist returned no results');
								}
							} else if (ResolvedArray[r].DataSource === DataSource.KITSU) {
								//confirm there were results (kitsu makes this so easy)
								if (ResolvedArray[r].data.meta.count > 0) {
									for (let c in ResolvedArray[r].data.data) {
										//ResolvedArray[r].data[c] is the object
										let a_result = ResolvedArray[r].data.data[c];
										//logger.log(ResolvedArray[r].DataSource,' ',a_result['volumes'],' | ',a_result['chapters']);
										//logger.log(a_result);
										let temp_dict = {};
										temp_dict[ResolvedArray[r].DataSource] = 'https://kitsu.io/manga/' + a_result['id'] + '/';
										if(!(dbLinks['mu'] === undefined || dbLinks['mu'] === '')) {
											//logger.warn('mu good: ',dbLinks['mu']);
											temp_dict[DataSource.MANGAUPDATES] = 'https://www.mangaupdates.com/series.html?id=' + dbLinks['mu'];
										}
										if(!(dbLinks['ap'] === undefined || dbLinks['ap'] === '')) {
											//logger.warn('ap good',dbLinks['ap']);
											temp_dict[DataSource.ANIMEPLANET] = 'https://www.anime-planet.com/manga/' + dbLinks['ap'];
										}
										let synonyms_try = a_result['abbreviatedTitles'];
										if (synonyms_try === null) {
											synonyms_try = [];
										}
										if (Array.isArray(synonyms_try) && typeof a_result['canonicalTitle'] === 'string') {
											synonyms_try = synonyms_try.concat([a_result['canonicalTitle']]);
										}
										let img_dict = {};
										img_dict[ResolvedArray[r].DataSource] = a_result['posterImage']['original'];

										let some_manga = new Anime({
											title_romaji: a_result['titles']['en_jp'],
											title_english: a_result['titles']['en'],
											title_japanese: a_result['titles']['ja_jp'],
											hyperlinks: new Hyperlinks(temp_dict),
											kitsu_score: a_result['averageRating'], //preserve kitsu rating AND mal score
											media_type: KitsuMediaTypeMap[a_result['subtype']],
											status: KitsuStatusMap[a_result['status']],
											volumes: no_volumes(a_result['volumeCount']) ? 'Unknown' : a_result['volumeCount'],
											chapters: no_volumes(a_result['chapterCount']) ? 'Unknown' : a_result['chapterCount'],
											synopsis_full: a_result['synopsis'],
											start_date: a_result['startDate'],
											end_date: a_result['endDate'],
											image: a_result['posterImage']['original'],
											images: new Hyperlinks(img_dict),
											nsfw: a_result['nsfw'], //confirmed bool 👍
											synonyms: new Synonyms(synonyms_try) //maybe this'll be good enough, please work ^
										});
										the_manga = Anime.consolidate(the_manga, some_manga);
									}
								} else {
									//anilist returned no results or an error
									logger.warn('kitsu returned no results');
								}
							}
						}

						//the_anime is the correct anime, no sorting matching bullshit left to do :D
						if(MangaOrLN === 'Manga') {
							logger.log('database: <' + query + '> => ' + the_manga.flattened.title);
							matchingCache.set('<'+query.toLowerCase()+'>', the_manga.flattened);
						}
						else if(MangaOrLN === 'LN') {
							logger.log('database: ]' + query + '[ => ' + the_manga.flattened.title);
							matchingCache.set(']'+query.toLowerCase()+'[', the_manga.flattened);
						}
						//THIS IS WHAT IT ALL BOILS DOWN TO
						resolve(the_manga.flattened);
					}).catch((Rejected) => {
						//err occured
						logger.error('what the hell, why is this? :\n', Rejected); //???
						reject(Rejected)
					});
				}

			}, (err, numOfRows) => {
				//complete call back, when database query completes
				if(err) throw err;
				if(!found_in_db) {
					reject('couldn\'t find that name in the database');
				}
			});
		});

	});
};

_.matchFromCache = (query) => {
	return new Promise((resolve, reject) => {
		let value = matchingCache.get(query.toLowerCase());
		if (value === undefined) {
			reject('nothing cached for this query');
		} else {
			logger.log('cache: ' + query + ' => ' + value.title);
			resolve(value);
		}
	});
}

module.exports = _;
