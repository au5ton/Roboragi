// Hyperlinks.js

const DataSource = require('../enums').DataSource;

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};
const non_empty_array = (ray) => {
    return (Array.isArray(ray) && ray.length > 0);
};

class Hyperlinks {
    constructor(dict) {
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
}

module.exports = Hyperlinks
