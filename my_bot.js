const Discord = require('discord.js')
const fetch = require("node-fetch");
const HTMLParser = require('node-html-parser')

const bot = new Discord.Client();

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`)
});

bot.on('message', msg => {
    if (msg.author.bot) {
        // do not react to bot messages (including this bot's own messages)
        return;
    }

    if (msg.content === '!ping') {
        pong(msg)
    } else if (msg.content.startsWith('!say ')) {
        say(msg)
    } else if (msg.content === '!fml') {
        fml(msg)
    } else if (msg.content.startsWith('!help')) {
        msg.reply('Available commands: !help, !ping, !say, !fml\n\n!ping - makes the bot reply with a pong\n!say <any text> - makes the bot say the given text\n!fml - replies with a random post from fmylife.com')
    }
});

bot.login('XXX')

// command implementations

function pong(msg) {
    msg.reply('Pong!')
}

function say(msg) {
    msg.reply('I say: ' + msg.content.substr(5))
}

function fml(msg) {
    const url = 'https://www.fmylife.com/random';
    fetch(url)
        .then(function (response) {
            //success!
            response.text().then(function(html) {
                const root = HTMLParser.parse(html)
                const firstPost = root.querySelector('.panel-content p a').text.trim()
                msg.reply(firstPost)
            })
        })
        .catch(function (err) {
            console.log(err)
            msg.reply('Could not fetch FML page!')
        });
}
