![roboruri-kouhai](img/roboruri.png)

# Roboruri
Roboruri is a Telegram bot (based off of [/u/Roboragi](https://www.reddit.com/user/Roboragi/)) which creates anime and manga links from MAL, Anilist, MangaUpdates, and Anime-Planet when requested. To credit the author of /u/Roboragi, this project is a fork of it and is prominently visible.

## Running an instance
Roboruri is written in Python. To get started:
- `git clone https://github.com/au5ton/Roboragi.git`
- `cd Roboragi`
- `pip install -r requirements.txt`
- You may have to also install the requirements for Acerola, as they don't install automatically. Use `pip install <module name goes here>` for each line in its [requirements.txt](https://github.com/Nihilate/Acerola/blob/master/requirements.txt).
- `cp config.example.ini config.ini`
- `nano config.ini` (edit the config file somehow)
- Fill everything out.

For MyAnimeList, `Auth` refers to the [HTTP request header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization). Easiest way to generate one of these is with [this javascript applet](http://www.blitter.se/utils/basic-authentication-header-generator/), which just calls:
```javascript
//btoa() is a built-in browser function
//https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
let username = 'foo';
let password = 'bar';
btoa(username+':'+password)
```

- (Optional) add your Telegram ID so you can perform administrator tasks by talking to the bot (not documented yet).
- `screen -S my_bot` (start a new screen session)
- `python roboruri/main.py` (start the bot)
- your bot is running persistently
- To detach of the screen session, use `CTRL+A` then `CTRL+D`.

Please don't run any of these unless you know what you're doing. I'm not good at writing idiot-proof stuff, but if you're a developer you shouldn't have trouble. If not, you could just use the official bot instead: https://t.me/roboruri_bot

## How it works
Roboruri depends on [Nihilate/Acerola](https://github.com/Nihilate/Acerola), a (work in progress) python module developed by the original /u/Roboragi developer. This module is the foundation of this project. I appreciate Nihilate's efforts and help with this project. <3

For Telegram interactivity, Roboruri depends on [eternnoir/pyTelegramBotAPI](https://github.com/eternnoir/pyTelegramBotAPI), a popular python wrapper for the Telegram HTTP API.

## What's with the name?
There were already existing bots on Telegram named 'roboragi' and other renditions (all of them seemed dead), so I decided on an alternative name that follows the naming tradition that /u/Roboragi set.

/u/Roboragi is named after [Araragi from Monogatari](http://bakemonogatari.wikia.com/wiki/Koyomi_Araragi), while Roboruri is named after [Ruri Gokou from Oreimo](http://oreimo.wikia.com/wiki/Ruri_Gokou).

## Picture
The photo is from NFGL on DeviantArt. They're really good at making vector art of moe. 100% shoutout:

https://nfgl.deviantart.com/

## Fun Facts
- Roboruri used to be named Roborugi for about 2 days when it was written in node.js (before I knew Acerola existed)
