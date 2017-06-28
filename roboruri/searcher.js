// searcher.js

const _ = {};
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);
const ANILIST = require('nani').init(process.env.ANILIST_CLIENT_ID, process.env.ANILIST_CLIENT_SECRET);
const DataSource = require('./enums').DataSource;
const logger = require('au5ton-logger');

const Resolved = require('./classes/Resolved');
const Rejected = require('./classes/Rejected');
const Anime = require('./classes/Anime');

_.searchAnimes = (query) => {
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
            ANILIST.get('anime/1').then((results) => {
                resolve(new Resolved(DataSource.ANILIST, results));
            })
            .catch((err) => {
                reject(new Rejected(DataSource.ANILIST, err));
            });
        }));
        Promise.all(promises).then((ResolvedArray) => {

            for(let Resolved of ResolvedArray) {
                if(Resolved.DataSource === DataSource.MAL) {
                    //expect results in particular format
                    resolve('something') //this returns:  failed to search with Searcher: TypeError: Cannot read property 'split' of undefined
                    //which means the reject()s and resolves are collapsing as intended!
                    //The error was in the message builder so our data made it over there without trouble.
                    //The logged message was made from the isValid promise, which means we caught the error without trouble too
                }
                else if(Resolved.DataSource === DataSource.ANILIST) {
                    //expect results in particular format
                    resolve('something') //this returns:  failed to search with Searcher: TypeError: Cannot read property 'split' of undefined
                    //which means the reject()s and resolves are collapsing as intended!
                    //The error was in the message builder so our data made it over there without trouble.
                    //The logged message was made from the isValid promise, which means we caught the error without trouble too
                }
            }
            // returned data is in arguments[0], arguments[1], ... arguments[n]
            // you can process it here
            //logger.log(arguments)
        }).catch((Rejected) => {
            //err occured
            reject(Rejected)
        });
    });

};

module.exports = _;
