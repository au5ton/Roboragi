![roboruri](img/roboruri.png)

[![CircleCI](https://circleci.com/gh/au5ton/Roboruri.svg?style=svg)](https://circleci.com/gh/au5ton/Roboruri) [![codebeat badge](https://codebeat.co/badges/e01673a6-ab15-44db-a030-970f38c86351)](https://codebeat.co/projects/github-com-au5ton-roboruri-master) 

# Roboruri

Roboruri is a Telegram bot (based off of [/u/Roboragi](https://www.reddit.com/user/Roboragi/)) which creates anime and manga links from MyAnimeList, Anilist, and Kitsu when requested. To credit the author of /u/Roboragi for all their assistance in the development, this project is a fork of it and is prominently visible.

Thanks [Nihilate](https://github.com/Nihilate)~!

## Telegram Channel

When updates posted here are pushed into production, you can get notified by following the roboruri_bot_updates Telegram channel.

https://t.me/roboruri_bot

https://t.me/roboruri_bot_updates

## Running an instance

Roboruri is written in Node.js v8.x, however she might work on lower versions like v6.x, but keep that in mind if any problems reveal themselves. To get started:

- `git clone https://github.com/au5ton/Roboruri.git`
- `cd Roboruri`
- `npm install`
- `cp .env.example .env`
- `nano .env` (edit the config file somehow)
- Fill everything out.
- `screen -S my_bot` (start a new screen session)
- `node bot.js` (start the bot)
- Look for any errors during the startup checks
- your bot is running persistently
- To detach of the screen session, use `CTRL+A` then `CTRL+D`.

Please don't run any of these unless you know what you're doing. If you encounter issues, I encourage you to report them here. If not, you could just use the official bot instead: <https://t.me/roboruri_bot>

## How it works

First, Roboruri plugs into [`telegraf`](https://npmjs.com/telegraf) to interact with Telegram and wait to be summoned. Once summoned, Roboruri checks the local cache and [synonym database](https://github.com/Nihilate/Roboragi/blob/fc4c2f06bd7410a23c302529165a86a33b68f9fc/roboragi/reference.db) for common/slang names to improve recognition. If nothing is found, an array of Promises are set loose on some anime databases. Once all Promises have resolved, the search results are indexed into instances of an `Anime` class. Instances of `Anime` can be consolidated with [`Object.assign()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) with some extra tinkery, which means multiple datasources can be combined easily.

Before consolidating the results, the result that best matches the query is calculated using [`string-similarity`](https://npmjs.com/string-similarity), which calculates a string's Dice's Coefficient. Once the best match for a title has been calulated across formats (romaji, english, japanese), the Assumed Real Title (ART) is used to reverse lookup the corresponding anime from the aforementioned search results.

Using the ART, the search results are consolidated into one `Anime` instance and is then used to print out:

![roboruri-kouhai](img/Screenshot_02.png)

### Spices up your group chats

![roboruri-kouhai](img/Screenshot_03.png)

### Inline summons

In addition to automatically "jumping in" when being summoned (akin to /u/Roboragi), Roboruri can be summoned as an inline bot to chats she's not even a part of:

#### [[demo video]](https://www.youtube.com/watch?v=tTV7xkHvmr8)

![](img/inline_demo_clip.gif)

## What's with the name?

There were already existing bots on Telegram named 'roboragi' and other renditions (all of them seemed dead), so I decided on an alternative name that follows the naming tradition that /u/Roboragi set.

/u/Roboragi is named after [Araragi from Monogatari](http://bakemonogatari.wikia.com/wiki/Koyomi_Araragi), while Roboruri is named after [Ruri Gokou from Oreimo](http://oreimo.wikia.com/wiki/Ruri_Gokou).

## Picture

The profile picture of roboruri_bot is from NFGL on DeviantArt:

https://nfgl.deviantart.com/

The profile picture of the roboruri_bot_updates channel is from Dekodere on DeviantArt:

https://dekodere.deviantart.com/

## Fun Facts

- Roboruri used to be named Roborugi for about 2 days when I couldn't decide on a name yet

## What's the point of all this?

<sub>Shhhh.</sub>
