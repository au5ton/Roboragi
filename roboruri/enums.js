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
    'KITSU':'DataSource.KITSU'
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
    'music': 'Music'
}

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
    'unreleased': 'Not yet aired', //We're definitely losing a lot of detail here, but for uniformity this is better for now
    'upcoming': 'Not yet aired',
    'tba': 'Not yet aired'
}

module.exports = _;
