require('dotenv').config(); //get the environment variables described in .env
const TelegramBot = require('node-telegram-bot-api');
const logger = require('au5ton-logger');
const util = require('util');

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

  i feel like this could be refractored so please feel free to shit on my code
  */
  let l_cnt = 0;
  let r_cnt = 0;
  for(let i = 0; i < msg.text.length; i++) {
      //Correctly tally the braces
      if(msg.text.charAt(i) === '{') {
          l_cnt++;
      }
      else if(msg.text.charAt(i) === '}') {
          r_cnt++;
      }

      //breaking condition
      if(l_cnt > 1 || r_cnt > 1) {
          break;
      }
  }
  if(l_cnt === 1 && r_cnt === 1) {
      let attempt = msg.text.match(/\{([^)]+)\}/);
      if(attempt !== null) {
          bot.sendMessage(chatId, util.inspect(attempt));
      }
  }

  // send a message to the chat acknowledging receipt of their message
  //bot.sendMessage(chatId, 'Received your message');
});

logger.log('Bot active.');
