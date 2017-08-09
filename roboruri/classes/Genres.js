// Synonyms.js

const logger = require('au5ton-logger')

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};
const is_empty = (val) => {
    return (val === null || val === undefined || val === '');
};
const non_empty_array = (ray) => {
    return (Array.isArray(ray) && ray.length > 0);
};

class Genres {
    constructor(ray) {
        if(non_empty(ray) && non_empty_array(ray)) {
            //remember to traverse backwards if you're removing values
            for(let i = ray.length-1; i >= 0; i--) {
                if(is_empty(ray[i])) {
                    ray.splice(i,1); //remove bad index
                }
            }
            this._array = ray;
        }
        else {
            this._array = [];
        }

    }
    get array() {
        return this._array;
    }
    static consolidate() {
        let temp_ray = [];

        //Nested loops to traverse every array of every Synonym
        //provided, add it to a Set to prevent duplicates.
        //Return as a new Synonym created from an Array from the set
        for(let i in arguments) {
            if(arguments[i] instanceof Genres) {
                temp_ray = temp_ray.concat(arguments[i].array);
            }
            else {
                //logger.warn('Hyperlinks.consolidate() supplied with non-Hyperlinks instance: ', arguments[i])
            }
            //logger.log(arguments[i])
        }
        //logger.log('concat rays: ', temp_ray);
        return new Genres(Array.from(new Set(temp_ray)));
    }
}

module.exports = Genres
