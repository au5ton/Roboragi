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

class Anime {
    constructor(options) {

        if(!non_empty(options)) {
            return
        }

        //all the titles
        if(non_empty(options.title_romaji)) {
            this.title_romaji = options.title_romaji;
        }
        if(non_empty(options.title_english)) {
            this.title_english = options.title_english;
        }
        if(non_empty(options.title_japanese)) {
            this.title_japanese = options.title_japanese;
        }
        //media_type
        if(non_empty(options.media_type)) {
            this.media_type = options.media_type;
        }
        //status
        if(non_empty(options.status)) {
            this.status = options.status;
        }
        //episode_count
        if(non_empty(options.episode_count)) {
            this.episode_count = options.episode_count;
        }
        //synopsis_full
        if(non_empty(options.synopsis_full)) {
            this.synopsis_full = options.synopsis_full;
        }
        //start_date
        if(non_empty(options.start_date)) {
            this.start_date = options.start_date;
        }
        //end_date
        if(non_empty(options.end_date)) {
            this.end_date = options.end_date;
        }
        //images
        if(non_empty(options.image)) {
            this.image = options.image
        }
        if(non_empty(options.nsfw)) {
            this.nsfw = options.nsfw;
        }
        //score
        if(non_empty(options.mal_score)) {
            this.mal_score = options.mal_score;
        }
        //score
        if(non_empty(options.anilist_score)) {
            this.anilist_score = options.anilist_score;
        }
        //score
        if(non_empty(options.kitsu_score)) {
            this.kitsu_score = options.kitsu_score;
        }
        if(non_empty(options.next_episode_countdown)) {
            this.next_episode_countdown = options.next_episode_countdown;
        }
        if(non_empty(options.next_episode_number)) {
            this.next_episode_number = options.next_episode_number;
        }
        if(non_empty(options.rotten_rating)) {
            this.rotten_rating = options.rotten_rating;
        }
        if(non_empty(options.hard_format)) {
            this.hard_format = options.hard_format;
        }
        if(non_empty(options.total_seasons)) {
            this.total_seasons = options.total_seasons;
        }
        if(non_empty(options.year_of_release)) {
            this.year_of_release = options.year_of_release;
        }
        if(non_empty(options.actors_str)) {
            this.actors_str = options.actors_str;
        }
        if(non_empty(options.original_query)) {
            this.original_query = options.original_query;
        }

        //Indentifiers
        if(non_empty(options.MAL_ID)) {
            this.MAL_ID = options.MAL_ID;
        }
        if(non_empty(options.ANILIST_ID)) {
            this.ANILIST_ID = options.ANILIST_ID;
        }
        if(non_empty(options.KITSU_ID)) {
            this.KITSU_ID = options.KITSU_ID;
        }

        //Printed media stuff
        if(non_empty(options.chapters)) {
            this.chapters = options.chapters;
        }
        if(non_empty(options.volumes)) {
            this.volumes = options.volumes;
        }

        //synonyms
        if(non_empty(options.synonyms) && options.synonyms instanceof Synonyms){
            this.synonyms = options.synonyms;
        }
        //hyperlinks
        if(non_empty(options.hyperlinks) && options.hyperlinks instanceof Hyperlinks) {
            this.hyperlinks = options.hyperlinks
        }

        //genres
        if(non_empty(options.genres) && options.genres instanceof Genres) {
            this.genres = options.genres
        }

        //images (instanceof hyperlinks)
        if(non_empty(options.images) && options.images instanceof Hyperlinks) {
            this.images = options.images
        }


        /*
        THIS IS IMPORTANT
        THIS IS IMPORTANT
        THIS IS IMPORTANT
        */
        this._flattened = false;
        /*
        THIS IS IMPORTANT
        THIS IS IMPORTANT
        THIS IS IMPORTANT
        */
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

        //all the titles
        if(non_def(copy.title_romaji)) {
            copy.title_romaji = null;
        }
        if(non_def(copy.title_english)) {
            copy.title_english = null;
        }
        if(non_def(copy.title_japanese)) {
            copy.title_japanese = null;
        }
        //media_type
        if(non_def(copy.media_type)) {
            copy.media_type = null;
        }
        //status
        if(non_def(copy.status)) {
            copy.status = null;
        }
        //episode_count
        if(non_def(copy.episode_count)) {
            copy.episode_count = null;
        }
        //synopsis_full
        if(non_def(copy.synopsis_full)) {
            copy.synopsis_full = null;
        }
        //start_date
        if(non_def(copy.start_date)) {
            copy.start_date = null;
        }
        //end_date
        if(non_def(copy.end_date)) {
            copy.end_date = null;
        }
        //images
        if(non_def(copy.images)) {
            copy.images = null;
        }
        //nsfw
        if(non_def(copy.nsfw)) {
            copy.nsfw = null;
        }
        //score
        if(non_def(copy.mal_score)) {
            copy.mal_score = null;
        }
        //score
        if(non_def(copy.anilist_score)) {
            copy.anilist_score = null;
        }
        //score
        if(non_def(copy.kitsu_score)) {
            copy.kitsu_score = null;
        }
        //next_episode_number
        if(non_def(copy.next_episode_number)) {
            copy.next_episode_number = null;
        }
        //next_episode_countdown
        if(non_def(copy.next_episode_countdown)) {
            copy.next_episode_countdown = null;
        }
        //rotten_rating
        if(non_def(copy.rotten_rating)) {
            copy.rotten_rating = null;
        }
        //total_seasons
        if(non_def(copy.total_seasons)) {
            copy.total_seasons = null;
        }
        //year_of_release
        if(non_def(copy.year_of_release)) {
            copy.year_of_release = null;
        }
        //actors_str
        if(non_def(copy.actors_str)) {
            copy.actors_str = null;
        }
        //original_query
        if(non_def(copy.original_query)) {
            copy.original_query = null;
        }
        //Identifers
        if(non_def(copy.MAL_ID)) {
            copy.MAL_ID = null;
        }
        if(non_def(copy.ANILIST_ID)) {
            copy.ANILIST_ID = null;
        }
        if(non_def(copy.KITSU_ID)) {
            copy.KITSU_ID = null;
        }

        //Printed media stuff
        //chapters
        if(non_def(copy.chapters)) {
            copy.chapters = null;
        }
        //volumes
        if(non_def(copy.volumes)) {
            copy.volumes = null;
        }

        //synonyms
        if(non_def(copy.synonyms)) {
            copy.synonyms = null;
        }
        //hyperlinks
        if(non_def(copy.hyperlinks)) {
            copy.hyperlinks = null;
        }
        //genres
        if(non_def(copy.genres)) {
            copy.genres = null;
        }
        //hyperlinks
        if(non_def(copy.images)) {
            copy.images = null;
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

// let dict = {};
// dict[DataSource.MAL] = 'http://hello.world'
// let dict2 = {};
// dict2[DataSource.ANILIST] = 'http://foo.bar'

//let temp = ;
//let consol =
// logger.warn('copy.flattened: ', consol.flattened)
// logger.log('Object.assign: ', Anime.consolidate(
//     new Anime({
//         title_english: 'a life in a better werl',
//         hyperlinks: new Hyperlinks(dict),
//         synonyms: new Synonyms(['Rem is best girl','',null,undefined,'Romance'])
//     }),
//     new Anime({
//         title_romaji: 'Re:Zero',
//         hyperlinks: new Hyperlinks(dict2),
//         synonyms: new Synonyms(['Emilia waifu','','Romance'])
//     }),
//     new Anime()
// )
// );
//logger.log('title: ', consol.title);
//logger.log('orgi: ', temp);
//logger.log('instanceof: ',consol instanceof Anime)


module.exports = Anime
