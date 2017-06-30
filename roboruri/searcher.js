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
    logger.log('searchAnimes() with \'', query,'\'');
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
                logger.ind().log('mal error caught');
                reject(new Rejected(DataSource.MAL, err));
            });
        }));
        promises.push(new Promise((resolve, reject) => {
            //Queries ANILIST
            //GET: {series_type}/search/{query}
            //attempt to make the query url friendly by removing all slashes and encoding
            //other punctuation
            ANILIST.get('anime/search/'+encodeURIComponent(query.replace(new RegExp('/', 'g'), ''))).then((results) => {
                resolve(new Resolved(DataSource.ANILIST, results));
            })
            .catch((err) => {
                logger.ind().log('anilist error caught');
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
            //logger.log(anime_arrays);
            //logger.ind().log('anime_arrays');
            //`r` should be the DataSource because anime_arrays is a dict
            //logger.warn('best_match before populating:',best_match);
            let sufficient_results = false;
            for(let r in anime_arrays) {
                //logger.ind().warn(r,' results:');
                if(anime_arrays[r].length === 0 || anime_arrays[r] === null || anime_arrays[r] === undefined) {
                    logger.ind().warn(r,' has no results to offer');
                }
                else {
                    best_match[r] = _.findBestMatchForAnimeArray(query,anime_arrays[r]);
                    //logger.ind(1).success('Picked ANIMEOBJ:',best_match[r]);
                    sufficient_results = true;
                }
            }
            if(!sufficient_results) {
                reject('insufficient results: has no results to offer');
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
            let sufficient_results_other = false;
            var very_best_match = new Anime();
            //Gather all romaji titles if available
            for(let r in best_match) {
                if(best_match[r].flattened.title_romaji !== null) {
                    sufficient_results_other = true;
                    topRomaji.push(best_match[r].title_romaji);
                }
                else {
                    //fuck this shit, there's no title
                }
            }
            //Reject if we've somehow made it this far without romaji titles
            if(!sufficient_results_other) {
                //how tf does this even happen
                reject('insufficient results: no romaji titles to compare');
            }
            //Assign SuperART
            SuperART = stringSimilarity.findBestMatch(query,topRomaji);

            //Reverse search with SuperART to consolidate results
            for(let r in best_match) {
                if(best_match[r].flattened.title_romaji !== null) {
                    //because SuperART is literally from best_match,
                    //there should be at least one instance in very_best_match

                    //previously I described matching with media_type in addition, but
                    //until I standardize media_type in the Anime object, I can't do that
                    //TO BE IMPLEMENTED
                    if(SuperART['bestMatch']['target'].toLowerCase().trim() === best_match[r].flattened.title_romaji.toLowerCase().trim()) {
                        very_best_match = Anime.consolidate(very_best_match,best_match[r]);
                    }
                    else {
                        logger.warn('`',best_match[r].flattened.title_romaji,'` was NOT CONSOLIDATED with `', SuperART['bestMatch']['target'],'`')
                    }
                }
                else {
                    //this is confirmed by the previous loop not to happen
                    reject('insufficient results: LOGIC ERROR');
                }
            }




            //logger.nl(1);
            //logger.error('------------------------------------');
            //logger.nl(2);

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
    let just_synonyms = [];
    for(let i in animes) {
        //logger.ind(1).log(i,' index');
        if(animes[i].flattened['title_romaji'] !== null){
            //logger.ind(2).log('r:`',animes[i]['title_romaji'],'`');
            just_titles_romaji.push(animes[i]['title_romaji']);
        }
        if(animes[i].flattened['title_english'] !== null){
            //logger.ind(2).log('e:`',animes[i]['title_romaji'],'`');
            just_titles_english.push(animes[i]['title_english']);
        }
        if(animes[i].flattened['title_japanese'] !== null){
            //logger.ind(2).log('j:`',animes[i]['title_romaji'],'`');
            just_titles_japanese.push(animes[i]['title_japanese']);
        }
        if(animes[i].flattened['synonyms'] !== null){
            //logger.ind(2).log('syn:`',animes[i]['synonyms'].array,'`');
            just_synonyms = just_synonyms.concat(animes[i]['synonyms'].array);
        }
    }

    /*
    Compare Dice rating across formats
    */

    //best match romaji
    let bmr = null;
    if(just_titles_romaji.length > 0) {
        bmr = stringSimilarity.findBestMatch(query,just_titles_romaji);
        //logger.ind(2).log('bmr:',bmr);
    }
    //best match english
    let bme = null;
    if(just_titles_english.length > 0) {
        bme = stringSimilarity.findBestMatch(query,just_titles_english);
        //logger.ind(2).log('bme:',bme);
    }
    //best match japanese
    let bmj = null;
    if(just_titles_japanese.length > 0) {
        bmj = stringSimilarity.findBestMatch(query,just_titles_japanese);
        //logger.ind(2).log('bmj:',bmj);
    }
    let bms = null;
    if(just_synonyms.length > 0) {
        bms = stringSimilarity.findBestMatch(query,just_synonyms);
        //logger.ind(2).log('bms:',bms);
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
    if(bmj === null) {
        /*
        this is so we don't have to copy and paste the If-statement monster below
        if it ain't there, the rating is -1. It will not be chosen no matter what.

        (hopefully)
        */
        bmj = {};
        bmj['bestMatch'] = {};
        bmj['bestMatch']['rating'] = -1.0;
    }
    if(bmr === null) {
        bmr = {};
        bmr['bestMatch'] = {};
        bmr['bestMatch']['rating'] = -1.0;
    }
    if(bme === null) {
        bme = {};
        bme['bestMatch'] = {};
        bme['bestMatch']['rating'] = -1.0;
    }
    if(bms === null) {
        bms = {};
        bms['bestMatch'] = {};
        bms['bestMatch']['rating'] = -1.0;
    }

    // logger.ind(2).warn('ratings:');
    // logger.ind(3).log('bmr',bmr['bestMatch']['rating']);
    // logger.ind(3).log('bme',bme['bestMatch']['rating']);
    // logger.ind(3).log('bmj',bmj['bestMatch']['rating']);
    // logger.ind(3).log('bms',bms['bestMatch']['rating']);

    if(bme['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bme['bestMatch']['rating'] >= bmj['bestMatch']['rating'] && bme['bestMatch']['rating'] >= bms['bestMatch']['rating']) {
        //english got the best rating
        art = bme['bestMatch']['target'];
        art_format = 'english';
        //logger.ind(2).success('Picked ART with ',art_format,' (',bme['bestMatch']['rating'],'):',art);
    }
    else if(bmr['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bmr['bestMatch']['rating'] >= bmj['bestMatch']['rating'] &&  bmr['bestMatch']['rating'] >= bms['bestMatch']['rating']) {
        //romaji got the best rating
        art = bmr['bestMatch']['target'];
        art_format = 'romaji';
        //logger.ind(2).success('Picked ART with ',art_format,' (',bmr['bestMatch']['rating'],'):',art);
    }
    else if(bmj['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bmj['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bmj['bestMatch']['rating'] >= bms['bestMatch']['rating']) {
        //japanese got the best rating
        art = bmj['bestMatch']['target'];
        art_format = 'japanese';
        //logger.ind(2).success('Picked ART with ',art_format,' (',bmj['bestMatch']['rating'],'):',art);
    }
    else if(bms['bestMatch']['rating'] >= bmr['bestMatch']['rating'] && bms['bestMatch']['rating'] >= bme['bestMatch']['rating'] && bms['bestMatch']['rating'] >= bmj['bestMatch']['rating']) {
        //japanese got the best rating
        art = bms['bestMatch']['target'];
        art_format = 'synonym';
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
        else if(art_format === 'synonym') {
            for(let n = 0; n < animes[i]['synonyms'].array.length; n++) {
                if(art === animes[i]['synonyms'].array[n]) {
                    //found the anime
                    return animes[i];
                }
            }
        }
    }

};

module.exports = _;
