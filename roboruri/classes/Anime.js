// Anime.js

const logger = require('au5ton-logger');

const DataSource = require('../enums').DataSource;
const Hyperlinks = require('./Hyperlinks');
const Synonyms = require('./Synonyms');
const Genres = require('./Genres');

/*

In order for an anime to be used specifically in Roboruri,
the resulting chat message must have a couple different
things:
- title (japanese, romaji if available, english if available)
- hyperlinks to different anime datasources
- MAL score
- media type (TV? OVA? Movie?)
- status
- episode count
- synopsis or show description
(nice to haves, will try and include anyway)
- start date
- end date
- image
- synonyms

These values might be named different things across different websites,
but comparable ones must fit in our little Anime class so that using an
Anime object is always safe and doesn't need second guessing. It should
be predictable. In that case, here are some rules:

- In an Anime object, a field that is confirmed empty
(for example, if MAL doesn't have a episode count)
MUST be `null`, not undefined, not 0. It must explicitly
be null so that using an Anime object means you only
have to check for a null, none of this inspecific bullshit.

- In an Anime object, every field should coorespond to each other.
If a search result on one site isn't the same as another, the
independent results must be confirmed to be the same show (via title
probably) before attempting to merge their data.

- In the end, you can only use one Anime object to print out a message.
We also want to generate one independent Anime object per
website/datasource for the sake of abstraction. This means that merging
Anime objects will be a thing, and it should be a straightfoward check
of if an Anime object's property is null or not (remember rule 1?).

- We don't want to worry about how the shows will merge before we
even get all the data. One Anime object will be made per datasource.
Using Anime.consolidate(), merging will be done there.

EDIT: Anime.consolidate was a headache and a half but I got it
nailed down. :)

(I think)

- CONSOLDATION: *.consolidate() must be capable of consolidating
"empty instances" and undefined's, because all instances that
are provided aren't flattened

Schema:
- Anime.title_romaji => string
- Anime.title_english => string
- Anime.title_japanese => string
- Anime.title => string, generated accessor
- Anime.hyperlinks => instance of Hyperlinks, enumerated dictionary
- Anime.score_str => number/string, whatever as long as its printable
- Anime.score_num => number, generated accessor; returns null if NaN
- Anime.media_type => string
- Anime.status => string
- Anime.episode_count => number/string
- Anime.synopsis_full => string
- Anime.synopsis => string, generated accessor
- Anime.start_date => ¯\_(ツ)_/¯
- Anime.end_date => ¯\_(ツ)_/¯
- Anime.image => string, hyperlink
- Anime.synonyms => instance of Synonyms, array of strings
*/



const non_empty = (val) => {
    return (val !== null && val !== undefined && val !== '');
};

const properties = [
    'title_romaji',
    'title_english',
    'title_japanese',
    'media_type',
    'status',
    'episode_count',
    'synopsis_full',
    'start_date',
    'end_date',
    'image',
    'nsfw',
    'mal_score',
    'anilist_score',
    'kitsu_score',
    'next_episode_countdown',
    'next_episode_number',
    'rotten_rating',
    'hard_format',
    'total_seasons',
    'year_of_release',
    'actors_str',
    'original_query',
    'MAL_ID',
    'ANILIST_ID',
    'KITSU_ID',
    'chapters',
    'volumes'
];

const special_properties = [
    'synonyms',
    'hyperlinks',
    'genres',
    'images'
];

class Anime {
    constructor(options) {

        //If no options specified
        if(!non_empty(options)) {
            return
        }

        /*Only apply a property if:
            1) the property is a real property of this class
            2) if the property is a useful value
        */
        for(let i in properties) {
            if(non_empty(options[properties[i]])) {
                this[properties[i]] = options[properties[i]];
            }
        }

        //Special properties
        if(non_empty(options.synonyms) && options.synonyms instanceof Synonyms){
            this.synonyms = options.synonyms;
        }
        if(non_empty(options.hyperlinks) && options.hyperlinks instanceof Hyperlinks) {
            this.hyperlinks = options.hyperlinks
        }
        if(non_empty(options.genres) && options.genres instanceof Genres) {
            this.genres = options.genres
        }
        if(non_empty(options.images) && options.images instanceof Hyperlinks) {
            this.images = options.images
        }

        this._flattened = false;
    }
    //generated accessors
    get title() {
        if(this._flattened) {
            if(this.title_english !== null) {
                return this.title_english
            }
            else if(this.title_romaji !== null) {
                return this.title_romaji
            }
            else if(this.title_japanese !== null) {
                return this.title_japanese
            }
            else {
                return null
            }
        }
        else {
            logger.warn('Anime.title invoked without being flattened first');
            return undefined
        }
    }
    //Returns 'Anime', 'Manga', 'LN', or 'Other' depending on whatever the media_type is
    get format() {
        if(this._flattened) {
            if(this.hard_format === 'Western Movie') {
                return 'Western Movie';
            }
            if(this.hard_format === 'Western TV') {
                return 'Western TV';
            }
            if(this.media_type === null) {
                return null
            }
            else if(this.media_type === 'TV') {
                return 'Anime'
            }
            else if(this.media_type === 'Movie') {
                return 'Anime'
            }
            else if(this.media_type === 'Special') {
                return 'Anime'
            }
            else if(this.media_type === 'OVA') {
                return 'Anime'
            }
            else if(this.media_type === 'ONA') {
                return 'Anime'
            }
            else if(this.media_type === 'Music') {
                return 'Other'
            }
            else if(this.media_type === 'Doujinshi') {
                return 'Manga'
            }
            else if(this.media_type === 'Manga') {
                return 'Manga'
            }
            else if(this.media_type === 'Manhua') {
                return 'Manga'
            }
            else if(this.media_type === 'Manhwa') {
                return 'Manga'
            }
            else if(this.media_type === 'OEL') {
                return 'Manga'
            }
            else if(this.media_type === 'One-shot') {
                return 'Manga'
            }
            else if(this.media_type === 'Light Novel') {
                return 'LN'
            }
        }
        else {
            logger.warn('Anime.format invoked without being flattened first');
            return undefined
        }
    }
    get all_titles() {
        //must use a flattened object to function properly
        if(this._flattened) {
            let dict = {};
            if(this.title_english !== null) {
                dict['title_english'] = this.title_english
            }
            if(this.title_romaji !== null) {
                dict['title_romaji'] = this.title_romaji
            }
            if(this.title_japanese !== null) {
                dict['title_japanese'] = this.title_japanese
            }
            if(this.synonyms !== null) {
                dict['synonyms'] = this.synonyms
            }
            //check for empty object
            if(Object.keys(dict).length === 0 && dict.constructor === Object) {
                return null
            }
            return dict;
        }
        else {
            logger.warn('Anime.all_titles invoked without being flattened first');
            return undefined
        }
    }
    get synopsis() {
        if(this.synopsis_full !== null) {
            var firstParagraph = this.synopsis_full.split('\n')[0];
            const txtLimit = 180;

            //sanitise for telegram (remove <br> tag)
            firstParagraph = firstParagraph.replace(new RegExp('<br>', 'g'), '');

            //shorten
            if (firstParagraph.length > txtLimit) {
                return firstParagraph.substring(0, txtLimit - 3) + '...';
            }
            return firstParagraph;
        }
        else {
            return null;
        }
    }
    get flattened() {
        let copy = new Anime(Object.assign({}, this))

        //if any properties are undefined, assert them as null
        for(let i in properties) {
            if(copy[properties[i]] === undefined) {
                copy[properties[i]] = null
            }
        }
        for(let i in special_properties) {
            if(copy[special_properties[i]] === undefined) {
                copy[special_properties[i]] = null;
            }
        }
        
        copy._flattened = true
        return copy;
    }
    static consolidate() {
        //consolidate Class objects manually and set aside to re-insert
        let temp_hyperlinks;
        let temp_synonyms;
        let temp_genres;
        let temp_images;
        for(let i in arguments) {
            if(arguments[i] instanceof Anime) {
                temp_hyperlinks = Hyperlinks.consolidate(temp_hyperlinks,arguments[i].hyperlinks);
                temp_synonyms = Synonyms.consolidate(temp_synonyms,arguments[i].synonyms);
                temp_genres = Genres.consolidate(temp_genres,arguments[i].genres);
                temp_images = Hyperlinks.consolidate(temp_images,arguments[i].images);
            }
            else {
                //logger.warn('Anime.consolidate() supplied with non-Anime instance: ', arguments[i])
            }
        }
        let copy = Object.assign.apply(this, [new Anime()].concat(Array.from(arguments)))
        copy.hyperlinks = temp_hyperlinks;
        copy.synonyms = temp_synonyms;
        copy.genres = temp_genres;
        copy.images = temp_images;
        return copy;
    }
}

module.exports = Anime
