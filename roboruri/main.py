"""
Roboruri Telegram bot
"""

import telebot
import os
import Acerola

from os.path import join, dirname
from dotenv import load_dotenv
from pprint import pprint

dotenv_path = join(dirname(__file__),'..', '.env')
load_dotenv(dotenv_path)

print(os.environ.get('MAL_USER'))


bot = telebot.TeleBot(os.environ.get('TELEGRAM_BOT_TOKEN'))
#anime =
print(bot.get_me())
pprint(Acerola)
