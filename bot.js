require('dotenv').config(); //get the environment variables described in .env
const TelegramBot = require('node-telegram-bot-api');
const logger = require('au5ton-logger');
const util = require('util');
const popura = require('popura');
const MAL = popura(process.env.MAL_USER, process.env.MAL_PASSWORD);

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

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
  let brace_l_cnt = brace_r_cnt = less_l_cnt = less_r_cnt = 0;

  for(let i = 0; i < msg.text.length; i++) {
      //Correctly tally the braces
      let next = msg.text.charAt(i);
      if(next === '{')
          brace_l_cnt++;
      else if(next === '}')
          brace_r_cnt++;
      else if(next === '<')
          less_l_cnt++;
      else if(next === '>')
          less_r_cnt++;
  }
  if(brace_l_cnt === 1 && brace_r_cnt === 1) {
      //perhaps an attempt to search {anime}

      let attempt = msg.text.match(/\{([^)]+)\}/);
      if(attempt !== null) {
          bot.sendMessage(chatId, 'Anime: '+attempt[1]);
      }
  }
  if(less_l_cnt === 1 && less_r_cnt === 1) {
      //perhaps an attempt to search {anime}

      let attempt = msg.text.match(/\<([^)]+)\>/);
      if(attempt !== null) {
          bot.sendMessage(chatId, 'Manga: '+attempt[1]);
      }
  }

  // send a message to the chat acknowledging receipt of their message
  //bot.sendMessage(chatId, 'Received your message');
});

logger.log('Bot active.');
