cd "$(dirname "$0")"

# update synonym database
curl 'https://raw.githubusercontent.com/Nihilate/Roboragi/master/roboragi/synonyms.db' -o synonyms.db
# start bot
node bot.js 2>&1 | tee -a bot_console.log
