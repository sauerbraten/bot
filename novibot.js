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
            msg.channel.send(`${msg.author} flops around a bit like a large trout!`, new Discord.RichEmbed().setImage(flopGIF()))
            break
        case 1:
            msg.channel.send(`${msg.author} slaps ${msg.mentions.users.first()} around a bit with a large trout!`, new Discord.RichEmbed().setImage(slapGIF()))
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

const slapGIF = () => pick([
    'https://media1.tenor.com/images/089a3adeec46220ead9879ba0b2e4703/tenor.gif',
    'https://media1.tenor.com/images/bdab32a7f54cd76ad132242bdcbad632/tenor.gif',
    'https://media1.tenor.com/images/7cff4fbe930bf280320f2e94978e2a94/tenor.gif',
    'https://media1.tenor.com/images/29cb608d5818c0bef2b7856a24f4c7f8/tenor.gif',
    'https://media1.tenor.com/images/3d791718475c30c00b665ac64b3ebaa4/tenor.gif',
    'https://media1.tenor.com/images/6480ef9483acd7c11f7fbd9bf3564391/tenor.gif',
    'https://media1.tenor.com/images/5d7c8fd4025eb5c62d7d1076287ba9ae/tenor.gif',
    'https://media1.tenor.com/images/be29fa0f5084551c36d0d5975cf6bf0a/tenor.gif',
    'https://media.tenor.com/images/a3664bd5936a6b49a8657449cdaba463/tenor.gif',
    'https://media1.tenor.com/images/312b5192fb1e4f5f03b4ab845212f83d/tenor.gif',
    'https://media1.tenor.com/images/6984543808009c6e289c903a5b661674/tenor.gif',
    'https://media.giphy.com/media/mEtSQlxqBtWWA/giphy.gif',
    'https://media.giphy.com/media/O3ao5CGUL7FK0/giphy.gif',
    'https://media.giphy.com/media/QVYiiemqUEe9q/giphy.gif',
    'https://media.giphy.com/media/j3iGKfXRKlLqw/giphy-downsized.gif',
    'https://media.giphy.com/media/UHLtCLwRsbDFK/giphy-downsized.gif',
    'https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif',
    'https://media.giphy.com/media/1zgOyLCRxCmV5G3GFZ/giphy.gif',
    'https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif',
    'https://media.giphy.com/media/Blsb9lFTZr54s/giphy.gif',
    'https://media.giphy.com/media/l2SpSQLpViJk9vhmg/giphy.gif',
    'https://media.giphy.com/media/q8AiNhQJVyDoQ/giphy.gif',
    'https://media.giphy.com/media/l0MYthTiOGtg1zsT6/giphy.gif',
    'https://media.giphy.com/media/3oEdv1Rdmo0Vd0YdW0/giphy.gif',
    'https://media.giphy.com/media/bGnQmK38QoSg8/giphy.gif',
    'https://media.giphy.com/media/s5zXKfeXaa6ZO/giphy.gif',
    'https://media.giphy.com/media/siS34ziU0gxsQ/giphy.gif',
    'https://media.giphy.com/media/8TpEwyNgVypZm/giphy.gif',
    'https://media.giphy.com/media/3o7TKPlA0hb9Oj2SqY/giphy.gif',
    'https://media.giphy.com/media/nq0qLlrcdahiw/giphy.gif',
    'https://media.giphy.com/media/1125FQpCo6Ubhm/giphy.gif',
    'https://media.giphy.com/media/DctClOfWhv1uw/giphy.gif'
])

const flopGIF = () => pick([
    'https://media.giphy.com/media/irU9BlmqEwZwc/giphy.gif',
    'https://media.giphy.com/media/3oEdv1Rdmo0Vd0YdW0/giphy.gif',
    'https://media.giphy.com/media/xUPGcnzWmq70t1oJ8I/giphy.gif',
    'https://media.giphy.com/media/vqNDninByDpU4/giphy.gif',
    'https://media.giphy.com/media/3WvdC5etwu52rLUAWm/giphy.gif',
    'https://media.giphy.com/media/26FPnj46RYsIWgYLe/giphy.gif',
    'https://media.giphy.com/media/a57Xed7DfAkDe/giphy.gif',
    'https://media.giphy.com/media/pSJmEIjCeKmWI/giphy.gif',
    'https://media.giphy.com/media/sRe0TGUMzmqNW/giphy.gif',
    'https://media.giphy.com/media/3ohjUNypcf1MNkM7rW/giphy.gif',
    'https://media.giphy.com/media/3NWNbk6Ja391S/giphy.gif',
    'https://media.giphy.com/media/1LmU5cGjBR1pC/giphy.gif',
    'https://media.giphy.com/media/k9hKQMscB8DZe/giphy.gif'
])
