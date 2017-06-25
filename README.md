![https://i.imgbox.com/nB2EGCUL.png](roborugi-kouhai)

# Roborugi
Roborugi is a Telegram bot (based off of [/u/Roboragi](https://www.reddit.com/user/Roboragi/)) which creates anime and manga links from MAL when requested. Some of the code may be plagiarized from the original project, as this is ultimately a crude port. To reflect that, this project is a fork of the original and is prominently visible.

## Running an instance
Roborugi is written in node.js. To get started:
- `git clone https://github.com/au5ton/Roboragi.git`
- `cd Roboragi`
- `npm install`
- `cp .env.example .env`
- `nano .env`
- enter your MAL username, password, and telegram bot token
- `screen -S my_bot`
- `node bot.js`
- your bot is running persistently

please don't run these unless you know what you're doing. if not, you could just use the official bot instead: https://t.me/roborugi_bot

## How it works
it's dead simple, read the one JS file there is.

## Current databases
- MAL (Anime + Manga)
