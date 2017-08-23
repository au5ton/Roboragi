![roboruri](img/roboruri.png)

# Roboruri
Roboruri is a Telegram bot (based off of [/u/Roboragi](https://www.reddit.com/user/Roboragi/)) which creates anime and manga links from [undecided] when requested. To credit the author of /u/Roboragi, this project is a fork of it and is prominently visible.

## ⚠️ Beta ⚠️
Roboruri is currently operating in beta. Expect problems and PLEASE FOR THE LOVE OF GOD REPORT THEM! Once I've ironed as many bugs as I can, I will take Roboruri out of beta stage.

#### Todo
- [all the things](https://github.com/au5ton/Roboruri/issues)

## Running an instance
Roboruri is written in Node.js. Node.js **version 6 and above is required** because ES6 features, however this project is debugged using Node v8.x, so keep that in mind if any problems reveal themselves. To get started:
- `git clone https://github.com/au5ton/Roboruri.git`
- `cd Roboruri`
- `npm install`
- `cp .env.example .env`
- `nano .env` (edit the config file somehow)
- Fill everything out.
- (Optional) add your Telegram ID so you can perform administrator tasks by talking to the bot (not documented yet).
- `screen -S my_bot` (start a new screen session)
- `node bot.js` (start the bot)
- your bot is running persistently
- To detach of the screen session, use `CTRL+A` then `CTRL+D`.

Please don't run any of these unless you know what you're doing. I'm not good at writing idiot-proof stuff, but if you're a developer you shouldn't have trouble. If not, you could just use the official bot instead: https://t.me/roboruri_bot

## How it works
First, Roboruri plugs into [`telegraf`](https://npmjs.com/telegraf) to interact with Telegram and wait to be summoned. Once summoned, Roboruri checks the local cache and synonym database for common/slang names to improve recognition. If nothing is found, an array of Promises are set loose on some anime databases ([`popura`](https://npmjs.com/popura), [`nani`](https://npmjs.com/nani), [`kitsu`](https://npmjs.com/kitsu), etc). Once all Promises have resolved, the search results are indexed into instances of a special `Anime` class. Instances of `Anime` can be consolidated with [`Object.assign()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) with some extra tinkery, which means multiple datasources can be combined easily.

Before consolidating the results, the result that best matches the query is calculated using [`string-similarity`](https://npmjs.com/string-similarity), which calculates a string's Dice's Coefficient. Once the best match for a title has been calulated across formats (romaji, english, japanese), the Assumed Real Title (ART) is used to reverse lookup the corresponding anime from the aforementioned search results.

Using the ART, the search results are consolidated into one `Anime` instance and is then used to print out:

![roboruri-kouhai](img/Screenshot_02.png)


### Inline summons
In addition to automatically "jumping in" when being summoned (identical to /u/Roboragi), Roboruri can be summoned as an inline bot to chats she's not even a part of:

#### [[demo video]](https://www.youtube.com/watch?v=tTV7xkHvmr8)

<img height="400px" src="img/inline_demo_clip.gif">


## What's with the name?
There were already existing bots on Telegram named 'roboragi' and other renditions (all of them seemed dead), so I decided on an alternative name that follows the naming tradition that /u/Roboragi set.

/u/Roboragi is named after [Araragi from Monogatari](http://bakemonogatari.wikia.com/wiki/Koyomi_Araragi), while Roboruri is named after [Ruri Gokou from Oreimo](http://oreimo.wikia.com/wiki/Ruri_Gokou).

## Picture
The photo is from NFGL on DeviantArt. They're really good at making vector art of moe. 100% shoutout:

https://nfgl.deviantart.com/

## Fun Facts
- Roboruri used to be named Roborugi for about 2 days when I couldn't decide on a name yet

## What's the point of all this?
<sub>Shhhh.</sub>
