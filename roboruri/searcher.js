// searcher.js

const _ = {};
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const ANILIST = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const logger = require('au5ton-logger');
const stringSimilarity = require('string-similarity');
const querystring = require('querystring');

const DataSource = require('./enums').DataSource;
const Resolved = require('./classes/Resolved');
const Rejected = require('./classes/Rejected');
const Anime = require('./classes/Anime');
const Hyperlinks = require('./classes/Hyperlinks');
const Synonyms = require('./classes/Synonyms');

_.searchAnimes = (query,query_format) => {
    return new Promise((resolve, reject) => {
        let results = {};
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
        promises.push(new Promise((resolve, reject) => {
            //Queries MAL
            MAL.searchAnimes(query).then((results) =>{
                resolve(new Resolved(DataSource.MAL, results));
            }).catch((err) => {
                reject(new Rejected(DataSource.MAL, err));
            });
        }));
        promises.push(new Promise((resolve, reject) => {
            //Queries ANILIST
            //GET: {series_type}/search/{query}
            ANILIST.get('anime/search/'+querystring.escape(query)).then((results) => {
                resolve(new Resolved(DataSource.ANILIST, results));
            })
            .catch((err) => {
                reject(new Rejected(DataSource.ANILIST, err));
            });
        }));
        Promise.all(promises).then((ResolvedArray) => {

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
            for(let e in DataSource) {
                anime_arrays[DataSource[e]] = [];
            }
            /*
            Store search results into anime objects, from their proper tags
            per DataSource
            */
            for(let r in ResolvedArray) {
                if(ResolvedArray[r].DataSource === DataSource.MAL) {
                    if(ResolvedArray[r].data[0] !== null) {
                        for(let c in ResolvedArray[r].data) {
                            //ResolvedArray[r].data[c] is the object
                            let a_result = ResolvedArray[r].data[c];
                            let temp_dict = {};
                            temp_dict[ResolvedArray[r].DataSource] = 'https://myanimelist.net/anime/'+a_result['id'];
                            anime_arrays[ResolvedArray[r].DataSource].push(new Anime({
                                title_romaji: a_result['title'],
                                title_english: a_result['english'],
                                hyperlinks: new Hyperlinks(temp_dict),
                                score_str: a_result['score'],
                                media_type: a_result['type'],
                                status: a_result['status'],
                                episode_count: a_result['episodes'],
                                synopsis_full: a_result['synopsis'],
                                start_date: a_result['start_date'],
                                end_date: a_result['end_date'],
                                image: a_result['image'],
                                synonyms: new Synonyms(a_result['synonyms'])
                            }));
                        }
                    }
                    else {
                        //mal returned no results
                        logger.warn('mal returned no results');
                    }
                }
                else if(ResolvedArray[r].DataSource === DataSource.ANILIST) {
                    if(typeof ResolvedArray[r].data['error'] !== 'object') {
                        for(let c in ResolvedArray[r].data) {
                            //ResolvedArray[r].data[c] is the object
                            let a_result = ResolvedArray[r].data[c];
                            let temp_dict = {};
                            temp_dict[ResolvedArray[r].DataSource] = 'https://anilist.co/anime/'+a_result['id']+'/';
                            anime_arrays[ResolvedArray[r].DataSource].push(new Anime({
                                title_romaji: a_result['title_romaji'],
                                title_english: a_result['title_english'],
                                hyperlinks: new Hyperlinks(temp_dict),
                                //score_str: String(parseFloat(a_result['average_score'])/10),
                                media_type: a_result['type'],
                                status: a_result['airing_status'],
                                episode_count: a_result['total_episodes'],
                                synopsis_full: a_result['description'],
                                start_date: a_result['start_date'],
                                end_date: a_result['end_date'],
                                image: a_result['image_url_lge'],
                                synonyms: new Synonyms(a_result['synonyms'])
                            }));
                        }
                    }
                    else {
                        //anilist returned no results or an error
                        logger.warn('anilist returned no results');
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
            var very_best_match = new Anime();
            //logger.log(anime_arrays);
            for(let r in anime_arrays) {
                //logger.log(r);
                best_match[r] = _.findBestMatchForAnimeArray(query,anime_arrays[r]);
                very_best_match = Anime.consolidate(very_best_match,best_match[r])
            }

            logger.log('q: {'+query+'} => '+very_best_match.flattened.title);
            //THIS IS WHAT IT ALL BOILS DOWN TO
            resolve(very_best_match.flattened);

        }).catch((Rejected) => {
            //err occured
            reject(Rejected)
        });
    });
};

// Receives: query string, array of Anime instances
// Returns: Anime instance
_.findBestMatchForAnimeArray = (query,animes) => {

    /*
    Get just titles for all formats for all animes
    */
    let just_titles_romaji = [];
    let just_titles_english = [];
    let just_titles_japanese = [];
    for(let i in animes) {
        if(animes[i].flattened['title_romaji'] !== null){
            just_titles_romaji.push(animes[i]['title_romaji']);
        }
        if(animes[i].flattened['title_english'] !== null){
            just_titles_english.push(animes[i]['title_english']);
        }
        if(animes[i].flattened['title_japanese'] !== null){
            just_titles_japanese.push(animes[i]['title_japanese']);
        }
    }

    /*
    Compare Dice rating across formats
    */

    //best match romaji
    let bmr = null;
    if(just_titles_romaji.length > 0) {
        bmr = stringSimilarity.findBestMatch(query,just_titles_romaji);
    }
    //best match english
    let bme = null;
    if(just_titles_english.length > 0) {
        bme = stringSimilarity.findBestMatch(query,just_titles_english);
    }
    //best match japanese
    let bmj = null;
    if(just_titles_japanese.length > 0) {
        bmj = stringSimilarity.findBestMatch(query,just_titles_japanese);
    }
    let art; //assumed real title
    let art_format; //english, romaji, japanese
    //first check if we got nothin
    if(bmr === null && bme === null && bmj === null) {
        //throw 'can\'t findBestMatchForAnimeArray if there are no titles';
        /*
        above line was a mistake^
        this DOESNT throw an error so that other DataSources still get checked,
        and this (deadass) one gets consolidated.

        this means that checking for a 'no match' must be done further up the pipeline.
        */
        return new Anime()
    }
    if(bmj == null) {
        /*
        this is so we don't have to copy and paste the If-statement monster below
        if it ain't there, the rating is -1. It will not be chosen no matter what.

        (hopefully)
        */
        bmj = {};
        bmj['bestMatch'] = {};
        bmj['bestMatch']['rating'] = -1.0;
    }
    if(bmr == null) {
        bmr = {};
        bmr['bestMatch'] = {};
        bmr['bestMatch']['rating'] = -1.0;
    }
    if(bme == null) {
        bme = {};
        bme['bestMatch'] = {};
        bme['bestMatch']['rating'] = -1.0;
    }

    //logger.log('    bme:',bme);
    //logger.log('    bmr:',bmr);
    //logger.log('    bmj:',bmj);

    if(bme['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bme['bestMatch']['rating'] >= bmj['bestMatch']['rating']) {
        //english got the best rating
        art = bme['bestMatch']['target'];
        art_format = 'english';
    }
    else if(bmr['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bmr['bestMatch']['rating'] >= bmj['bestMatch']['rating']) {
        //romaji got the best rating
        art = bmr['bestMatch']['target'];
        art_format = 'romaji';
    }
    else if(bmj['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bmj['bestMatch']['rating'] >= bme['bestMatch']['rating']) {
        //japanese got the best rating
        art = bmj['bestMatch']['target'];
        art_format = 'japanese';
    }

    /*
    Use ART and ART format to reverse lookup the anime search result
    */
    for(let i in animes) {
        if(art_format === 'english') {
            if(art === animes[i]['title_english']) {
                //found the anime
                return animes[i];
            }
        }
        else if(art_format === 'romaji') {
            if(art === animes[i]['title_romaji']) {
                //found the anime
                return animes[i];
            }
        }
        else if(art_format === 'japanese') {
            if(art === animes[i]['title_japanese']) {
                //found the anime
                return animes[i];
            }
        }
    }

};

module.exports = _;
