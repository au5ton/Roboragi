require('dotenv').config(); //get the environment variables described in .env
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const ANILIST = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const logger = require('au5ton-logger');
const stringSimilarity = require('string-similarity');

var promises = [];

if(process.argv[2] === undefined) {
    logger.error('define process.argv[2] pls');
    process.exit();
}

promises.push(new Promise((resolve, reject) => {
    //Queries ANILIST
    //GET: {series_type}/search/{query}
    let just_titles = [];
    ANILIST.get('anime/search/'+process.argv[2]).then((results) => {
        for(let i in results) {
            just_titles.push(results[i]['title_romaji']);
            logger.log('    ', results[i]['title_romaji'])
        }
        let best_match = stringSimilarity.findBestMatch(process.argv[2],just_titles)
        logger.success('best match via Dice on Anilist: ', best_match['bestMatch']);
        resolve(just_titles);
    }).catch((err) => {
        reject(err);
    });
}));
promises.push(new Promise((resolve, reject) => {
    //Queries ANILIST
    //GET: {series_type}/search/{query}
    let just_titles = [];
    MAL.searchAnimes(process.argv[2]).then((results) =>{
        for(let i in results) {
            just_titles.push(results[i]['title']);
            logger.log('    ', results[i]['title'])
        }
        let best_match = stringSimilarity.findBestMatch(process.argv[2],just_titles)
        logger.success('best match via Dice on MAL: ', best_match['bestMatch']);
        resolve(just_titles);
    }).catch((err) => {
        reject(err);
    });
}));



Promise.all(promises).then((results) => {
    let all_titles = [];
    for(let r in results) {
        for(let c in results[r]) {
            all_titles.push(results[r][c]);
        }
    }
    let best_match = stringSimilarity.findBestMatch(process.argv[2],all_titles)
    logger.success('best match via Dice OVERALL: ', best_match['bestMatch']);
}).catch((err) => {
    //oh noes
    logger.error(err);
});
