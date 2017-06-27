from Acerola import Acerola, DataSource

from configparser import ConfigParser

config = ConfigParser()
config.read('config.ini')

acerola = Acerola(config)
acerola.anime.add_source(DataSource.KITSU,
                         DataSource.ANILIST,
                         DataSource.MAL,
                         DataSource.ANIMEPLANET,
                         DataSource.ANIDB)

acerola.manga.add_source(DataSource.KITSU,
                         DataSource.ANILIST,
                         DataSource.MAL,
                         DataSource.ANIMEPLANET,
                         DataSource.MANGAUPDATES)

acerola.light_novel.add_source(DataSource.KITSU,
                               DataSource.ANILIST,
                               DataSource.MAL,
                               DataSource.ANIMEPLANET,
                               DataSource.MANGAUPDATES)


def get_anime(term):
    results = acerola.anime.search_closest(term)
    for source_type, anime in results.items():
        if DataSource.MAL in results.keys():
            print('title from MAL, specifically: '+results[DataSource.MAL].title_romaji)
        if anime:
            print(str(source_type) + ': ' + (anime.title_romaji if anime.title_romaji else anime.title_english) + ', ' + anime.urls[source_type])
        else:
            print('Nothing found for ' + str(source_type))

    print(acerola.anime.consolidate(results))

def get_score(term):
    print('term: '+str(term))
    results = acerola.light_novel.search_closest(term)
    for source_type, anime in results.items():
        if anime and hasattr(results[source_type], 'title_romaji'):
            print(str(source_type) + ': ' + str(type(anime.title_romaji))+' '+str(anime.title_romaji))
        #if anime and hasattr(results[source_type], 'chapter_count'):
        #    print(str(source_type) + ': ' + str(type(anime.chapter_count))+' '+str(anime.chapter_count))


    #print(acerola.anime.consolidate(results))

def get_manga(term):
    results = acerola.light_novel.search_closest(term)
    for source_type, manga in results.items():
        if manga:
            print(str(source_type) + ': ' + (manga.title_romaji if manga.title_romaji else manga.title_english) + ', ' + manga.urls[source_type])
        else:
            print('Nothing found for ' + str(source_type))

    print(acerola.manga.consolidate(results))


def get_light_novel(term):
    results = acerola.light_novel.search_closest(term)
    for source_type, light_novel in results.items():
        if light_novel:
            print(str(source_type) + ': ' + (light_novel.title_romaji if light_novel.title_romaji else light_novel.title_english) + ', ' + light_novel.urls[source_type])
        else:
            print('Nothing found for ' + str(source_type))

    print(acerola.light_novel.consolidate(results))


#get_anime('Fate/Zero')
# results = acerola.anime.search_closest('Eromanga sensei')
# print(type(results[DataSource.MAL].score))
# print(results[DataSource.MAL].score)
# print(type(results[DataSource.ANILIST].score))
# print(results[DataSource.ANILIST].score)
get_score('eromanga-sensei')
