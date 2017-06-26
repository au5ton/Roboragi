"""
Roboruri Telegram bot
"""

import telebot
import os

from os.path import join, dirname
from dotenv import load_dotenv

dotenv_path = join(dirname(__file__),'..', '.env')
load_dotenv(dotenv_path)

print(os.environ.get('MAL_USER'))


bot = telebot.TeleBot(os.environ.get('TELEGRAM_BOT_TOKEN'))
print(bot.get_me())
