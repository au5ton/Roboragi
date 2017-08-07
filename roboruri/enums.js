// enums.js

const _ = {};

_.SummonType = {
    'BRACES':'SummonType.BRACES',
    'BRACKETS':'SummonType.BRACKETS',
    'LTGT':'SummonType.LTGT',
    'PIPES':'SummonType.PIPES'
};
_.DataSource = {
    'MAL':'DataSource.MYANIMELIST',
    'ANILIST':'DataSource.ANILIST',
    'KITSU':'DataSource.KITSU',
    'MANGAUPDATES':'DataSource.MANGAUPDATES',
    'ANIMEPLANET':'DataSource.ANIMEPLANET',
    'IMDB':'DataSource.OMDB_API'
};
_.MalMediaTypeMap = {
    'TV': 'TV',
    'Movie': 'Movie',
    'Special': 'Special',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'Manga': 'Manga',
    'Novel': 'Light Novel',
    'One-shot': 'One-shot',
    'Doujinshi': 'Doujinshi',
    'Manhwa': 'Manhwa',
    'Manhua': 'Manhua'
}
_.AnilistMediaTypeMap = {
    'TV': 'TV',
    'TV Short': 'TV',
    'Movie': 'Movie',
    'Special': 'Special',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'Music': 'Music',
    'Manga': 'Manga',
    'Novel': 'Light Novel',
    'One Shot': 'One-shot',
    'Doujin': 'Doujinshi',
    'Manhwa': 'Manhwa',
    'Manhua': 'Manhua'
}

_.KitsuMediaTypeMap = {
    'TV': 'TV',
    'movie': 'Movie',
    'special': 'Special',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'music': 'Music',
    'doujin': 'Doujinshi',
    'manga': 'Manga',
    'novel': 'Light Novel',
    'manhua': 'Manhua',
    'manhwa': 'Manhwa',
    'oel': 'OEL',
    'oneshot': 'One-shot'
}

_.IMDBMediaTypeMap = {
    'movie': 'Movie',
    'series': 'TV'
}
/*
'TV',
'Movie',
'Special',
'OVA',
'ONA',
'Music',
'Doujinshi',
'Manga',
'Manhua',
'Manhwa',
'OEL',
'One-shot'
'Light Novel'

current
finished
tba
unreleased
upcoming
*/

_.MalStatusMap = {
    'Not yet aired': 'Not yet aired',
    'Finished Airing': 'Finished Airing',
    'Currently Airing': 'Currently Airing',
    'Publishing': 'Publishing',
    'Finished': 'Finished'
}
_.AnilistStatusMap = {
    'finished airing': 'Finished Airing',
    'currently airing': 'Currently Airing',
    'not yet aired': 'Not yet aired',
    'finished publishing': 'Finished Publishing',
    'publishing': 'Publishing',
    'not yet published': 'Not yet published',
    'cancelled': 'Cancelled'
}
_.KitsuStatusMap = {
    'finished': 'Finished Airing',
    'current': 'Currently Airing',
    'unreleased': 'Unreleased', //this isn't uniform, but fuck it. anilist isn't uniform and
    'upcoming': 'Upcoming', //we have Anime and Manga being forced into the same object for shits and giggles
    'tba': 'TBA'
}

module.exports = _;
