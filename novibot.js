const Discord = require('discord.js')
const fetch = require("node-fetch");
const HTMLParser = require('node-html-parser')


/* commands set-up */

const commands = {
    '!ping': makeCmd(ping, 'makes the bot reply with a pong'),
    '!vengavenga': makeCmd(vengavenga, 'let me show you something!'),
    '!abfahrt': makeCmd(abfahrt, 'let me show you something!'),
    '!slap': makeCmd(slap, 'slap a mate'),
    '!fml': makeCmd(fml, 'gives you a random post from fmylife.com'),
    '!whois': makeCmd(whois, 'looks up the name at chef.sauerworld.org'),
    '!help': makeCmd(help, 'shows this help text')
}


/* actual bot stuff */

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
        return
    }

    const cmd = commands[msg.content.split(' ')[0].toLowerCase()]
    if (cmd === undefined) {
        // if there is no command matching the first message token, do nothing
        return
    }

    // execute function implementing the command
    cmd.f(msg)
});

bot.login(token)


/* command implementations */

function slap(msg) {
    switch (msg.mentions.users.size) {
        case 0:
            msg.channel.send(`${msg.author} flops around a bit like a large trout!`)
            break
        case 1:
            msg.channel.send(`${msg.author} slaps ${msg.mentions.users.first()} around a bit with a large trout! :fish::sweat_drops:`)
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

function ping(msg) {
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

function help(msg) {
    msg.channel.send(
        'Available commands:\n' +
        Object.entries(commands)                 // convert commands object to array of key-value pairs, e.g. [ ['!ping', {f: ping, desc: '...'}], ['!fml', {f: fml, desc: '...'}] ]
            .map(c => `${c[0]} - ${c[1].desc}`)  // from each key-value pair, generate a string like this '<key> - <desc field from value>' (key is first element in key-value pair array, value is second)
            .join('\n')                          // join all the strings by putting newlines inbetween them
    )
}


/* utility functions */

// takes a command implementation and a description string and
// returns an object, e.g. {f: ping, desc: '...'}
function makeCmd(f, desc) {
    return {
        f: f,      // the function implementing the command
        desc: desc // a description (used for help text)
    }
}

// randomly picks one element from arr and returns it
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
