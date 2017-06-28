// Synonyms.js

const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};
const non_empty_array = (ray) => {
    return (Array.isArray(ray) && ray.length > 0);
};

class Synonyms {
    constructor(ray) {
        if(non_empty(ray) && non_empty_array(ray)) {
            for(let i = 0; i < ray.length; i++) {
                if(!non_empty(ray[i])) {
                    ray.splice(i,1); //remove bad index
                }
            }
            this._array = ray;
        }
        else {
            this._array = null;
        }

    }
    get array() {
        return this._array;
    }
}

module.exports = Synonyms
