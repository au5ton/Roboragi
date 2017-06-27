"""
Roboruri Telegram bot entry point
(to start the bot, call this file)
"""

import telebot
import os
import math
import re
import colorama
import json

from Acerola import Acerola, DataSource
from Acerola.enums import Type, Status
from os.path import join, dirname
from dotenv import load_dotenv
from pprint import pprint
from base64 import standard_b64encode
from random import randint
from configparser import ConfigParser

# define constants
STAR_CHAR = '\u272A'

# load config.ini
config = ConfigParser()
config.read('config.ini')

# initialize Acerola
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

# make colorama work on Windows
colorama.init(convert=True,autoreset=True)
STYLE = {}
STYLE['ERROR'] = colorama.Fore.RED + colorama.Back.BLACK
STYLE['WARN'] = colorama.Fore.YELLOW + colorama.Back.BLACK
STYLE['SUCCESS'] = colorama.Fore.GREEN

# initialize telegram bot
bot = telebot.TeleBot(config['Telegram']['BotToken'])

"""
Startup checks. Verifies that everything if functioning normally
as best a possible.
"""
print('Bot active. Performing startup checks.')
print(STYLE['WARN']+'Is our Telegram token valid?')
try:
    print(STYLE['SUCCESS']+'Telegram token is valid. (id: '+str(bot.get_me().id)+')')
except telebot.apihelper.ApiException:
    print(STYLE['ERROR']+'Telegram token is invalid.')
    exit()
except Exception:
    print(STYLE['ERROR']+'Unexpected error:', sys.exc_info()[0])
    exit()
print(STYLE['WARN']+'Is our Acerola configuration good?')
print(STYLE['WARN']+'    Query: \'KonoSuba\'')
try:
    results = acerola.anime.consolidate(acerola.anime.search_closest('KonoSuba'))
    print(STYLE['SUCCESS']+'Acerola successfully retrieved sample anime.')
    if hasattr(results, 'title_romaji'):
        print(STYLE['SUCCESS']+'    Romanji: '+results.title_romaji)
    if hasattr(results, 'title_english'):
        print(STYLE['SUCCESS']+'    English: '+results.title_english)
    if hasattr(results, 'title_japanese'):
        print(STYLE['SUCCESS']+'    Native: '+results.title_japanese)
except Exception:
    print(STYLE['ERROR']+'Acerola configration has problems:', sys.exc_info()[0])
    exit()

"""
Generates chat messages based on the provided anime objects
"""
def build_anime_chat_message(results, options=None):
    """
    anime datasource enum:
    DataSource.KITSU
    DataSource.ANILIST
    DataSource.MAL
    DataSource.ANIMEPLANET
    DataSource.ANIDB

    ideal chat message:
    OreImo (MAL, A-P, AL, ADB)
    7.43✪ | TV | Status: Finished Airing | Episodes: 12
    Genres: Comedy, Slice of Life
    Kirino Kousaka embodies the ideal student with equally entrancing looks.

    ideal chat message requires:
    - English title, preferably from MAL
    - MAL score
    - media type (TV, OVA, etc)
    - status
    - episode count
    - MAL synopsis
    """
    message = ''
    title = None
    score = None
    media_type = None
    status = None
    genres = None
    genres_str = ''
    series_count = None
    synopsis = None
    synopsis_limit = 180
    urls = ''
    if DataSource.MAL in results.keys():
        """
        don't put anything in here that happens to be MAL and
        think 'oh i can just put that in here ahead of time'
        because you're wrong. only put stuff in here that
        you want to be preferential to MAL over other sites.
        """
        if hasattr(results[DataSource.MAL],'title_english'):
            title = results[DataSource.MAL].title_english
        else:
            # assumes that there's always a romanji title
            title = results[DataSource.MAL].title_romaji
        if hasattr(results[DataSource.MAL],'description'):
            if len(results[DataSource.MAL].description) > synopsis_limit:
                synopsis = results[DataSource.MAL].description[:synopsis_limit-3]+'...'
            else:
                synopsis = results[DataSource.MAL].description
        if hasattr(results[DataSource.MAL],'score'):
            score = results[DataSource.MAL].score
    # attempts to populate all things in one interation for performance...
    # so the code is messy
    for source_type, entry in results.items():
        if entry:
            # sets the title to the first non-mal entry
            if title == None and hasattr(entry,'title_english'):
                title = entry.title_english
            elif title == None:
                # assumes that there's always a romanji title
                # i mean, if there's an entry, there's gonna be
                # a title, right?
                title = entry.title_romaji

            # populate urls
            if DataSource.MAL == source_type:
                urls += '<a href=\"'+entry.urls[source_type]+'\">MAL</a>,'
            if DataSource.KITSU == source_type:
                urls += '<a href=\"'+entry.urls[source_type]+'\">KT</a>,'
            if DataSource.ANILIST == source_type:
                urls += '<a href=\"'+entry.urls[source_type]+'\">AL</a>,'
            if DataSource.ANIMEPLANET == source_type:
                urls += '<a href=\"'+entry.urls[source_type]+'\">A-P</a>,'
            if DataSource.ANIDB == source_type:
                urls += '<a href=\"'+entry.urls[source_type]+'\">ADB</a>,'

            # populate media_type
            if media_type == None and hasattr(entry, 'type'):
                if entry.type == Type.TV:
                    media_type = 'TV'
                elif entry.type == Type.MOVIE:
                    media_type = 'Movie'
                elif entry.type == Type.OVA:
                    media_type = 'OVA'
                elif entry.type == Type.ONA:
                    media_type = 'ONA'
                elif entry.type == Type.SPECIAL:
                    media_type = 'Special'

            # populate status
            if status == None and hasattr(entry, 'status'):
                if entry.status == Status.UNKNOWN:
                    status = 'Unknown'
                elif entry.status == Status.FINISHED:
                    status = 'Finished'
                elif entry.status == Status.ONGOING:
                    status = 'Currently Airing'
                elif entry.status == Status.UPCOMING:
                    status = 'Upcoming'
                elif entry.status == Status.CANCELLED:
                    status = 'Cancelled'

            # populate series_count
            if series_count == None and hasattr(entry, 'episode_count'):
                series_count = entry.episode_count

            # in_second_but_not_in_first = in_second - in_first
            # populate genres
            if genres == None and hasattr(entry, 'genres'):
                genres = entry.genres
            elif genres != None and hasattr(entry, 'genres'):
                # python sets() are neat
                # this appends to the end of genres...
                # ...what set items are in entry.genres...
                # ...but NOT in genres
                # it's basically adding the difference
                # cool, huh?
                genres = genres | (entry.genres - genres)

            # populate synopsis
            if synopsis == None and hasattr(entry, 'description'):
                if len(entry.description) > synopsis_limit:
                    synopsis = entry.description[:synopsis_limit-3]+'...'
                else:
                    synopsis = entry.description

            # everything is populated
        # end out if(entry)
    # end of for-loop

    # actually construct the message
    urls = urls[:-1] # remove the trailing comma
    for item in list(genres)[:-1]: # iterates over genres, except the last one
        genres_str += str(item)+', ' # appends each one with a comma
    genres_str += list(genres)[-1] # appends the last one

    """
    at this point in the code, everything should be populated
    with a string, and `messages` should be an empty string.
    """
    message += '<b>'+title+'</b> ('+urls+')\n'
    message += str(score)+STAR_CHAR+' | '+str(media_type)+' | Status: '+str(status)+' | Episodes: '+str(series_count)+'\n'
    message += 'Genres: '+genres_str+'\n'
    message += synopsis

    return message

def build_manga_chat_message(results, options=None):
    """
    manga datasource enum:
    DataSource.KITSU
    DataSource.ANILIST
    DataSource.MAL
    DataSource.ANIMEPLANET
    DataSource.MANGAUPDATES
    """
    message = ''
    for source_type, entry in results.items():
        if entry:
            if message == '':
                message += '<b>'+entry.title_romaji+'</b> (<a href=\"'+entry.urls[source_type]+'\">link</a>) [NYI]'
    return message

def build_light_novel_chat_message(results, options=None):
    """
    light_novel datasource enum:
    DataSource.KITSU
    DataSource.ANILIST
    DataSource.MAL
    DataSource.ANIMEPLANET
    DataSource.MANGAUPDATES
    """
    message = ''
    for source_type, entry in results.items():
        if entry:
            if message == '':
                message += '<b>'+entry.title_romaji+'</b> (<a href=\"'+entry.urls[source_type]+'\">link</a>) [NYI]'
    return message

"""
Bot code for Telegram interactivity
Message handlers and if-statements galore.
"""
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.send_message(message.chat.id, 'I reply with links to animes with the following format: {anime TV}, [anime OVA + Movies], |exact title|, <manga>')

@bot.message_handler(content_types=['text'])
def on_text_message(msg):
    chat_id = msg.chat.id

    if msg.text.startswith('roboruri ping'):
        bot.send_message(chat_id, 'pong')

    if msg.text.startswith('thanks roboruri'):
        catchphrases = ['I\'ll try my best', 'I don\'t know anyone by that name.', '( ´ ∀ `)']
        bot.reply_to(msg, catchphrases[randint(0,len(catchphrases)-1)])

    # process summons
    pat = {}
    pat['braces'] = re.compile('\{([^)]+)\}') # anime
    pat['brackets'] = re.compile('\]([^)]+)\[') # light novels
    pat['ltgt'] = re.compile('\<([^)]+)\>') # manga
    pat['pipes'] = re.compile('\|([^)]+)\|') # not sure what to do with this anymore

    if pat['braces'].search(msg.text) and msg.text.count('{') == 1 and msg.text.count('}') == 1:
        # probably a {brace} summon
        attempt = pat['braces'].search(msg.text)
        results = acerola.anime.search_closest(attempt[1])
        sufficient_results = False
        for source_type, anime in results.items():
            if anime:
                sufficient_results = True
        # if you have a least one instance of the show across these sites,
        # that should (hopefully) be enough
        if sufficient_results:
            bot.reply_to(msg, build_anime_chat_message(results), parse_mode='html', disable_web_page_preview=True)

    if pat['ltgt'].search(msg.text) and msg.text.count('<') == 1 and msg.text.count('>') == 1:
        # probably a <ltgt> summon
        attempt = pat['ltgt'].search(msg.text)
        results = acerola.manga.search_closest(attempt[1])
        sufficient_results = False
        for source_type, anime in results.items():
            if anime:
                sufficient_results = True
        # if you have a least one instance of the show across these sites,
        # that should (hopefully) be enough
        if sufficient_results:
            bot.reply_to(msg, build_manga_chat_message(results), parse_mode='html', disable_web_page_preview=True)

    if pat['brackets'].search(msg.text) and msg.text.count('[') == 1 and msg.text.count(']') == 1:
        # probably a ]bracket[ summon
        attempt = pat['brackets'].search(msg.text)
        results = acerola.light_novel.search_closest(attempt[1])
        sufficient_results = False
        for source_type, anime in results.items():
            if anime:
                sufficient_results = True
        # if you have a least one instance of the show across these sites,
        # that should (hopefully) be enough
        if sufficient_results:
            bot.reply_to(msg, build_light_novel_chat_message(results), parse_mode='html', disable_web_page_preview=True)

    if pat['pipes'].search(msg.text) and msg.text.count('|') == 2:
        # probably a |pipes| summon
        attempt = pat['pipes'].search(msg.text)
        bot.reply_to(msg, 'pipes: '+attempt[1])

"""
Tell the bot to start accepting messages.
Synchronous pyTelegramBotAPI will halt right here until it received SIGINT.
(I think)
"""
print(STYLE['SUCCESS']+'Telegram bot is polling.')
bot.polling()
