"""
Roboruri Telegram bot
"""

import telebot
import os
import math
import re
import colorama
import json

from Acerola import Acerola, DataSource
from os.path import join, dirname
from dotenv import load_dotenv
from pprint import pprint
from base64 import standard_b64encode
from random import randint
from configparser import ConfigParser

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

# startup checks
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
    print(STYLE['SUCCESS'])
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
    pat['braces'] = re.compile('\{([^)]+)\}')
    pat['brackets'] = re.compile('\[([^)]+)\]')
    pat['ltgt'] = re.compile('\<([^)]+)\>')
    pat['pipes'] = re.compile('\|([^)]+)\|')

    if pat['braces'].search(msg.text) and msg.text.count('{') == 1 and msg.text.count('}') == 1:
        # probably a {brace} summon
        attempt = pat['braces'].search(msg.text)
        bot.reply_to(msg, 'braces: '+attempt[1])

    if pat['brackets'].search(msg.text) and msg.text.count('[') == 1 and msg.text.count(']') == 1:
        # probably a [bracket] summon
        attempt = pat['brackets'].search(msg.text)
        bot.reply_to(msg, 'brackets: '+attempt[1])

    if pat['ltgt'].search(msg.text) and msg.text.count('<') == 1 and msg.text.count('>') == 1:
        # probably a <ltgt> summon
        attempt = pat['ltgt'].search(msg.text)
        bot.reply_to(msg, 'ltgt: '+attempt[1])

    if pat['pipes'].search(msg.text) and msg.text.count('|') == 2:
        # probably a |pipes| summon
        attempt = pat['pipes'].search(msg.text)
        bot.reply_to(msg, 'pipes: '+attempt[1])

        bot.polling()
"""
