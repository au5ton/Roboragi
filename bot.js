require('dotenv').config(); //get the environment variables described in .env
const TelegramBot = require('node-telegram-bot-api');
const logger = require('au5ton-logger');
const util = require('util');
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
	polling: {
		autoStart: false
	}
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
	const chatId = msg.chat.id;

    if(msg.text.startsWith('thanks roborugi')) {
        let catchphrases = ['I\'ll try my best', 'I don\'t know anyone by that name.', '( ´ ∀ `)'];
        bot.sendMessage(chatId, catchphrases[Math.floor(Math.random()*catchphrases.length)]);
    }
    else if(msg.text.startsWith('roborugi source code')) {
        bot.sendMessage(chatId, 'https://github.com/au5ton/Roboragi');
    }
	/*check if message is a query
	a messages is a query if:
	- there is exactly 1 `{` per message
	- there is exactly 1 `}` per message
	- the message matches the regex: \{([^)]+)\}
	OR
	- there is exactly 1 `<` per message
	- there is exactly 1 `>` per message
	- the message matches the regex: \<([^)]+)\>

	i feel like this could be refractored so please feel free to shit on my code
	*/
	let brace_l_cnt = brace_r_cnt = less_l_cnt = less_r_cnt = brack_l_cnt = brack_r_cnt = 0;

	for (let i = 0; i < msg.text.length; i++) {
		//Correctly tally the braces
		let next = msg.text.charAt(i);
		if (next === '{')
			brace_l_cnt++;
		else if (next === '}')
			brace_r_cnt++;
		else if (next === '<')
			less_l_cnt++;
		else if (next === '>')
            less_r_cnt++;
		else if (next === '[')
            brack_l_cnt++;
        else if (next === ']')
            brack_r_cnt++;

	}
	if (brace_l_cnt === 1 && brace_r_cnt === 1) {
		//perhaps an attempt to search {anime}

		let attempt = msg.text.match(/\{([^)]+)\}/);
		if (attempt !== null) {
			MAL.searchAnimes(attempt[1]).then((animes) => {
				if (animes[0] !== null) {
					bot.sendMessage(chatId, buildAnimeChatMessage(animes[0]), {parse_mode: 'html', disable_web_page_preview: true});
				}
			}).catch((r) => {
				//well that sucks
                logger.error('failed to search mal: ', r);
			});
		}
	}
    if (brack_l_cnt === 1 && brack_r_cnt === 1) {
		//perhaps an attempt to search [anime]
		let attempt = msg.text.match(/\[([^)]+)\]/);
		if (attempt !== null) {
			MAL.searchAnimes(attempt[1]).then((animes) => {
				if (animes[0] !== null) {
					bot.sendMessage(chatId, buildAnimeChatMessage(animes[0], {alt: true}), {parse_mode: 'html', disable_web_page_preview: true});
				}
			}).catch((r) => {
				//well that sucks
                logger.error('failed to search mal: ', r);
			});
		}
	}
	if (less_l_cnt === 1 && less_r_cnt === 1) {
		//perhaps an attempt to search <manga>
		let attempt = msg.text.match(/\<([^)]+)\>/);
		if (attempt !== null) {
			MAL.searchMangas(attempt[1]).then((mangas) => {
				if (mangas[0] !== null) {
					bot.sendMessage(chatId, buildMangaChatMessage(mangas[0]), {parse_mode: 'html', disable_web_page_preview: true});
				}
			}).catch((r) => {
				//well that sucks
                logger.error('failed to search mal: ', r);
			});
		}
	}

});

const star_char = '\u2B51';
function buildAnimeChatMessage(anime, options) {
    options = options || {};
    let message = '';
	if(anime['english'] !== null && anime['english'] !== '') {
        message += '<b>'+anime['english']+'</b>';
    }
    else {
        message += '<b>'+anime['title']+'</b>';
    }
    message += ' (<a href=\"https://myanimelist.net/anime/'+anime['id']+'\">MAL</a>)\n';
    message += anime['score'] + star_char + ' | ' + anime['type'] + ' | Status: ' + anime['status'] + ' | Episodes: ' + anime['episodes'];
    if(options.alt) {
        message += '\n'+anime['synopsis'].split('\n')[0];
    }
    return message;
}

function buildMangaChatMessage(manga) {
    let message = '';
	if(manga['english'] !== null && manga['english'] !== '') {
        message += '<b>'+manga['english']+'</b>';
    }
    else {
        message += '<b>'+manga['title']+'</b>';
    }
    message += ' (<a href=\"https://myanimelist.net/manga/'+manga['id']+'\">MAL</a>)\n';
    message += manga['score'] + star_char + ' | ' + manga['type'] + ' | Status: ' + manga['status'] + ' | Volumes: ' + manga['volumes'];
    return message;
}

logger.log('Bot active. Performing startup checks.');

logger.warn('Is our Telegram token valid?');
bot.getMe().then((r) => {
	//doesn't matter who we are, we're good
	logger.success('Telegram token is valid.');
	bot.startPolling().then((r) => {
		logger.success('Telegram bot polling started.');
	}).catch((r) => {
		logger.error('Telegram bot failed to start polling. ', r);
		process.exit();
	})
}).catch((r) => {
	logger.error('Telegram bot invalid token: ', r.code, ' ', r.body);
	process.exit();
});

logger.warn('Is out MAL authentication valid?');
MAL.verifyAuth().then((r) => {
	logger.success('MAL authenticated. ');
}).catch((r) => {
	logger.error('MAL failed to authenticate: ', r.message);
	process.exit();
});
