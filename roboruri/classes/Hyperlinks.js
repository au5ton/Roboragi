// Hyperlinks.js

const logger = require('au5ton-logger');

const DataSource = require('../enums').DataSource;

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};
const non_empty_array = (ray) => {
    return (Array.isArray(ray) && ray.length > 0);
};
const non_def = (val) => {
    //doesn't account for if an object has the value defined,
    //but has decided to leave it holding undefined for
    //whatever reason.
    //fuck it, bulldozer that shit with nulls
    return (val === undefined)
};

class Hyperlinks {
    constructor(dict) {
        if(!non_empty(dict)) {
            //logger.error('If you want to create an \"empty\" Hyperlinks instance, provide an empty Dictionary as a parameter.');
            return
        }
        if(non_empty(dict) && typeof dict === 'object') {
            for(let key in dict) {

                //before any further checking,
                //is the val in the dict a string?
                if(typeof dict[key] === 'string') {
                    //If the key in the dict is a listed DataSource
                    //basically if dict has keys like 'DataSource.ANILIST',
                    //and not coincidentally something else in another enum
                    let flag = false
                    for(let e in DataSource) {
                        if(DataSource[e] === key) {
                            flag = true
                        }
                    }
                    if(!flag) {
                        // remove properties in the dict that aren't in DataSource
                        delete dict[key];
                    }
                }
                else {
                    delete dict[key];
                }
            }
            //by this point, every single item in the dict
            //is confirmed to be a key-value pair where the
            //key is a DataSource and the value is something
            this._dict = dict
        }
    }
    get dict() {
        return this._dict;
    }
    static consolidate() {
        let just_dicts = [];
        //puts all internal dicts of Hyperlinks objects into an array
        //so Object.assign can combine them all
        for(let i in arguments) {
            if(arguments[i] instanceof Hyperlinks) {
                just_dicts.push(arguments[i].dict)
            }
            else {
                //logger.warn('Hyperlinks.consolidate() supplied with non-Hyperlinks instance: ', arguments[i])
            }
        }
        //Then re-wraps the resulting combined dictionary
        //back into a Hyperlinks object

        //when combining with Object.assign, it sure is useful as hell,
        //but unpredictable which value will come through if there's duplicate
        //entries. The best workaround is just to not have duplicate entries.
        return new Hyperlinks(Object.assign.apply(this, [{}].concat(just_dicts)));
    }

}

// let dict = {};
// dict[DataSource.MAL] = 'http://hello.world' //kept
// dict[DataSource.ANILIST] = 'http://bar.foo'
// let dict2 = {};
// dict2[DataSource.ANILIST] = 'http://foo.bar' //kept
// dict2[DataSource.MAL] = 'http://world.hello'
//
// let hyper = Hyperlinks.consolidate(new Hyperlinks(dict),new Hyperlinks({}))
//logger.log(hyper)
//logger.log(hyper.dict[DataSource.MAL])

module.exports = Hyperlinks
