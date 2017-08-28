require('dotenv').config(); //get the environment variables described in .env
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const ANILIST = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const logger = require('au5ton-logger');
const stringSimilarity = require('string-similarity');
const Kitsu = require('kitsu');
const kitsu = new Kitsu();

var promises = [];

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

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};

// if(process.argv[2] === undefined) {
//     logger.error('define process.argv[2] pls');
//     process.exit();
// }
// else {
//     logger.log('trying: ',process.argv[2]);
// }
//
// promises.push(new Promise((resolve, reject) => {
//     //Queries ANILIST
//     //GET: {series_type}/search/{query}
//     let just_titles = [];
//     ANILIST.get('anime/search/'+process.argv[2]).then((results) => {
//         //logger.log('anilist: ',results);
//         logger.log('typeof: ', typeof results['error'])
//         for(let i in results) {
//             just_titles.push(results[i]['title_romaji']);
//             logger.log('    R|', results[i]['title_romaji'])
//             if(non_empty(results[i]['title_english'])) {
//                 just_titles.push(results[i]['title_english']);
//                 logger.log('    E|', results[i]['title_english']);
//             }
//         }
//         let best_match = stringSimilarity.findBestMatch(process.argv[2],just_titles)
//         logger.success('best match via Dice on Anilist: ', best_match['bestMatch']['target']);
//         resolve(just_titles);
//     }).catch((err) => {
//         reject(err);
//     });
// }));
// promises.push(new Promise((resolve, reject) => {
//     //Queries ANILIST
//     //GET: {series_type}/search/{query}
//     let just_titles = [];
//     MAL.searchAnimes(process.argv[2]).then((results) =>{
//         //logger.log('mal: ', results);
//         for(let i in results) {
//             just_titles.push(results[i]['title']);
//             logger.log('    R|', results[i]['title']);
//             if(non_empty(results[i]['english'])) {
//                 just_titles.push(results[i]['english']);
//                 logger.log('    E|', results[i]['english']);
//             }
//         }
//         let best_match = stringSimilarity.findBestMatch(process.argv[2],just_titles)
//         logger.success('best match via Dice on MAL: ', best_match['bestMatch']['target']);
//         resolve(just_titles);
//     }).catch((err) => {
//         reject(err);
//     });
// }));
//
//
//
// Promise.all(promises).then((results) => {
//     let all_titles = [];
//     for(let r in results) {
//         for(let c in results[r]) {
//             all_titles.push(results[r][c]);
//         }
//     }
//     let best_match = stringSimilarity.findBestMatch(process.argv[2],all_titles)
//     logger.success('best match via Dice OVERALL: ', best_match['bestMatch']['target']);
// }).catch((err) => {
//     //oh noes
//     logger.error(err);
// });

// let show = new Anime({
//     title_english: 'hello'
// });
// function buildHyperlinksForAnime(anime) {
// 	let message = '';
// 	for(let e in DataSource) {
// 		logger.log(anime.hyperlinks.dict[DataSource[e]]);
// 	}
// 	return message;
// }
//
//
// logger.log('before flat: ',show)
// let other = show.flattened
// logger.log('after flat: ',show);

// kitsu.auth({
//     clientId: process.env.KITSU_CLIENT_ID,
//     clientSecret: process.env.KITSU_CLIENT_SECRET,
//     username: process.env.KITSU_USER,
//     password: process.env.KITSU_PASSWORD
// }).then((what) => {
//     //logger.log(what);
//
//     if (kitsu.isAuth) console.log('Authenticated')
//     else console.log('Not authenticated')
//
//     kitsu.get('manga', {
//         filter: {
//             text: 'eromanga',
//             subtype: 'novel'
//         }
//     }).then((response) => {
//         logger.log(response.meta.count);
//         for(let i in response.data) {
//             logger.log(response.data[i]);
//         }
//     });
//     kitsu.get('anime/12761/episodes', {}).then((response) => {
//         logger.warn(response);
//     });
// });

// MAL.verifyAuth().then((r) => {
// 	logger.success('MAL authenticated. ');
//     logger.warn('try: ',process.argv[2])
//     MAL.searchMangas(process.argv[2]).then((results) => {
//         for(let i in results) {
//             if(String(results[i]['id']) === '67979') {
//                 logger.succes(results[i]['id'], ' | ', results[i]['title']);
//             }
//             else {
//                 logger.log(results[i]['id'], ' | ', results[i]['title']);
//             }
//         }
//     }).catch((err) => {
//         logger.error('mal error caught: ', err);
//         process.exit();
//     });
// }).catch((r) => {
// 	logger.error('MAL failed to authenticate: ', r.message);
// 	process.exit();
// });


// ANILIST.get('anime/97863').then((results) => {
//     logger.log(results['airing'])
//     let x = new Anime();
//     x.unrelated_tag = 'doot';
//     logger.log(x);
// }).catch((err) => {
//     logger.error(err);
// });

//tt4731072

const imdb = require('imdb-api');
const token = {apiKey: process.env.OMDB_API_KEY};
// imdb.search({
//     title: process.argv[2]
// }, token).then((results)=> {
//     logger.log(results.results);
// }).catch(console.log);
//imdb.getById('tt2575988', token).then(logger.log).catch(logger.error);

// const TVDB = require('node-tvdb');
// const tvdb = new TVDB(process.env.THETVDB_API_KEY);
//
// //289909
//
// tvdb.getSeriesByName(process.argv[2])
// .then((response) => {
//     for(let i in response) {
//         logger.log(response[i]['seriesName'], ' (',response[i]['id'],')',' [',response[i]['status'],']');
//     }
// })
// .catch(logger.error);

// tvdb.getSeriesById(289909)
// .then(logger.log)
// .catch(logger.error);


//logger.log('access_token: ', access_token);

const natural = require('natural'); //NLP
// logger.log(natural.PorterStemmer.stem('good job roboruri')); // stem a single word
//
var tokenizer = new natural.WordTokenizer();
// let tokens = tokenizer.tokenize(process.argv[2]);
// logger.log(tokens);

const MENTION_WILDCARD = 'dea5d6976f7c54b48ff5d6c539121232f52092ef';

let small = tokenizer.tokenize('wrong '+MENTION_WILDCARD+' bot'); //is this
let bigger = tokenizer.tokenize('you mentione the wrong thing bot'); //inside this

const natural_language = require('./roboruri/natural_language');
logger.log(natural_language.arrayInsideArrayWithSameOrder(small,bigger));
