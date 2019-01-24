const Discord = require('discord.js')
const fetch = require("node-fetch");
const HTMLParser = require('node-html-parser')

const token = process.env.DISCORD_TOKEN
if (token == undefined) {
    console.log('Provide a discord bot token as DISCORD_TOKEN!')
    return
}

const bot = new Discord.Client();

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`)
});


bot.on('message', msg => {
    if (msg.author.bot) {
        // do not react to bot messages (including this bot's own messages)
        return;
    }

    const cmd = msg.content.split(' ')[0].toLowerCase();
    switch (cmd) {
        case '!ping':
            pong(msg)
            break
        case '!vengavenga':
            vengavenga(msg)
            break
        case '!abfahrt':
            abfahrt(msg)
            break
        case '!slap':
            slap(msg)
            break
        case '!fml':
            fml(msg)
            break
        case '!whois':
            whois(msg)
            break
        case '!help':
            msg.channel.send(
                'Available commands:\n' +
                '!ping - makes the bot reply with a pong\n' +
                '!fml - fetch a random post from fmylife.com\n' +
                '!whois <name> - looks up the name at chef.sauerworld.org\n' +
                '!vengavenga - Let me show you something!\n' +
                '!abfahrt - Let me show you something!\n' +
                '!slap - Slap a mate'
            )
            break
    }
});

bot.login(token)

// command implementations

function slap(msg) {
    let victim
    switch (msg.mentions.users.size) {
        case 0:
        msg.channel.send(`${msg.author} flops around a bit like a large trout!`)
            break
        case 1:
        msg.channel.send(`${msg.author} slaps ${msg.mentions.users.first()} around a bit with a large trout!`)
            break
        default:
            msg.reply('one at a time, please!')
            return
    }
}

function vengavenga(msg) {
    msg.reply('https://youtu.be/MT7dbmV_-ek?t=16')
}

function abfahrt(msg) {
    msg.reply('https://www.youtube.com/watch?v=bfVK9z7BlUM')
}

function pong(msg) {
    msg.reply('pong! :ping_pong:')
}

function fml(msg) {
    const url = 'https://www.fmylife.com/random';
    fetch(url)
        .then(response => {
            response.text().then(html => {
                const root = HTMLParser.parse(html)
                const firstPost = root.querySelector('.panel-content p a').text.trim()
                msg.channel.send(firstPost)
            })
        })
        .catch(err => {
            console.log(err)
            msg.reply(`I couldn't fetch ${url}!`)
        });
}

function whois(msg) {
    let parts = msg.content.split(' ')
    if (parts.length != 2) {
        msg.reply('please provide exactly one name! Example: !whois player1')
        return
    }
    // '!whois' is the first element, our query is the second
    const url = `https://chef.sauerworld.org/lookup?q=${encodeURI(parts[1])}&sorting=name_frequency`
    fetch(`${url}&format=json`)
        .then(response => {
            response.json().then(json => {
                let uniques = json.results
                    .map(r => Discord.escapeMarkdown(r.name))         // extract name from each result
                    .filter((v, i, names) => names.indexOf(v) === i)  // discard duplicates (= keep uniques)
                    .slice(0, 5)                                      // max. 5 results
                const query = Discord.escapeMarkdown(json.query)
                if (uniques.length === 0) {
                    msg.channel.send(`I could not find any results for *${query}*! ${noResultsEmoji()}`)
                } else {
                    msg.channel.send(`Results for *${query}*: ${uniques.join(', ')}. More at: ${url}`)
                }
            })
        })
        .catch(err => {
            console.log(err)
            msg.reply(`I couldn't fetch ${url}!`)
        });
}

// utility functions

const pick = arr => arr[Math.floor(Math.random() * arr.length)]

const noResultsEmoji = () => pick([
    ':zipper_mouth:',
    ':worried:',
    ':frowning2:',
    ':slight_frown:',
    ':pensive:',
    ':frowning:',
    ':thinking:',
    ':shrug:',
    ':cry:',
    ':sob:',
    ':no_mouth:'
])
