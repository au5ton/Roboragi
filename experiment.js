// Experiment with code before replacing in the project

require('dotenv').config(); //get the environment variables described in .env
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const ANILIST = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
require('au5ton-logger')({prefix_date: true});
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

kitsu.auth({
    clientId: process.env.KITSU_CLIENT_ID,
    clientSecret: process.env.KITSU_CLIENT_SECRET,
    username: process.env.KITSU_USER,
    password: process.env.KITSU_PASSWORD
}).then((what) => {
    //console.log(what);

    if (kitsu.isAuth) console.log('Authenticated')
    else console.log('Not authenticated')

    // kitsu.get('anime', {
    //     filter: {
    //         text: 'redline'
    //     }
    // }).then((response) => {
    //     console.log(response.meta.count);
    //     for(let i in response.data) {
    //         console.log(response.data[i]);
    //     }
    // });
    kitsu.get('anime/4659', {}).then((response) => {
        console.warn(response);
    });
});

// MAL.verifyAuth().then((r) => {
// 	console.success('MAL authenticated. ');
//     console.warn('try: ',process.argv[2])
//     MAL.searchMangas(process.argv[2]).then((results) => {
//         for(let i in results) {
//             if(String(results[i]['id']) === '67979') {
//                 console.succes(results[i]['id'], ' | ', results[i]['title']);
//             }
//             else {
//                 console.log(results[i]['id'], ' | ', results[i]['title']);
//             }
//         }
//     }).catch((err) => {
//         console.error('mal error caught: ', err);
//         process.exit();
//     });
// }).catch((r) => {
// 	console.error('MAL failed to authenticate: ', r.message);
// 	process.exit();
// });


// ANILIST.get('anime/97863').then((results) => {
//     console.log(results['airing'])
//     let x = new Anime();
//     x.unrelated_tag = 'doot';
//     console.log(x);
// }).catch((err) => {
//     console.error(err);
// });

//tt4731072

//const imdb = require('imdb-api');
//const token = {apiKey: process.env.OMDB_API_KEY};
// imdb.search({
//     title: process.argv[2]
// }, token).then((results)=> {
//     console.log(results.results);
// }).catch(console.log);
//imdb.getById('tt2575988', token).then(console.log).catch(console.error);

// const TVDB = require('node-tvdb');
// const tvdb = new TVDB(process.env.THETVDB_API_KEY);
//
// //289909
//
// tvdb.getSeriesByName(process.argv[2])
// .then((response) => {
//     for(let i in response) {
//         console.log(response[i]['seriesName'], ' (',response[i]['id'],')',' [',response[i]['status'],']');
//     }
// })
// .catch(console.error);

// tvdb.getSeriesById(289909)
// .then(console.log)
// .catch(console.error);


//console.log('access_token: ', access_token);

// const natural = require('natural'); //NLP
// // console.log(natural.PorterStemmer.stem('good job roboruri')); // stem a single word
// //
// var tokenizer = new natural.WordTokenizer();
// // let tokens = tokenizer.tokenize(process.argv[2]);
// // console.log(tokens);
//
// const MENTION_WILDCARD = 'dea5d6976f7c54b48ff5d6c539121232f52092ef';
//
// let small = tokenizer.tokenize('wrong '+MENTION_WILDCARD+' bot'); //is this
// let bigger = tokenizer.tokenize('you mentione the wrong thing bot'); //inside this
//
// const natural_language = require('./roboruri/natural_language');
// console.log(natural_language.arrayInsideArrayWithSameOrder(small,bigger));
