"""
Roboruri Telegram bot
"""

import telebot
import os
import math
import re
import colorama

from Acerola import Acerola
from os.path import join, dirname
from dotenv import load_dotenv
from pprint import pprint
from base64 import standard_b64encode
from random import randint

# load .env variables into the os.environ
dotenv_path = join(dirname(__file__),'..', '.env')
load_dotenv(dotenv_path)

# make colorama work on Windows
colorama.init(convert=True,autoreset=True)
STYLE = {}
STYLE['ERROR'] = colorama.Fore.RED + colorama.Back.BLACK
STYLE['WARN'] = colorama.Fore.YELLOW + colorama.Back.BLACK
STYLE['SUCCESS'] = colorama.Fore.GREEN

bot = telebot.TeleBot(os.environ.get('TELEGRAM_BOT_TOEN'))
# anime = Acerola({
#     'MyAnimeList': {
#         'Auth':  standard_b64encode((os.environ.get('MAL_USER')+':'+os.environ.get('MAL_PASSWORD')).encode()),
#         'UserAgent:': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
#     }
# })
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

#bot.polling()
