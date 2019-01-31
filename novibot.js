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
    '!sex': makeCmd(sex, 'probably makes you wet', true),
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

    if (!cmdAllowed(msg.channel, cmd)) {
        // don't react to private commands in public channels
        return
    }

    // execute the function implementing the command
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

function sex(msg) {
    switch (msg.mentions.users.size) {
        case 0:
            msg.channel.send(`${msg.author} wants to have some sexy time! :smirk:`, new Discord.RichEmbed().setImage(sexyGIF()))
            break
        case 1:
            msg.channel.send(`${msg.author} wants to bang ${msg.mentions.users.first()} :eggplant: :peach:`, new Discord.RichEmbed().setImage(bangGIF()))
            break
        default:
            msg.reply('Several at once? Keep cool, playboy.')
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
        Object.entries(commands)                         // convert commands object to array of key-value pairs, e.g. [ ['!ping', {f: ping, desc: '...'}], ['!fml', {f: fml, desc: '...'}] ]
            .filter(c => cmdAllowed(msg.channel, c[1]))  // when the !help command came from a public channel, filter out the private commands (otherwise let all commands through the filter)
            .map(c => `${c[0]} - ${c[1].desc}`)          // from each key-value pair, generate a string like this '<key> - <desc field from value>' (key is first element in key-value pair array, value is second)
            .join('\n')                                  // join all the strings by putting newlines inbetween them
    )
}


/* utility functions */

// takes a command implementation and a description string and
// returns an object, e.g. {f: ping, desc: '...'}
function makeCmd(f, desc, private = false) {
    return {
        f: f,             // the function implementing the command
        desc: desc,       // a description (used for help text)
        private: private, // wether or not this command is available in public channels
    }
}

// returns true when channel is not a DM channel and not in the predefined set of private channels
function isPublic(ch) {
    if (ch instanceof Discord.DMChannel) {
        // DM chats are never public
        return false
    }

    return !(
        [
            '536858354404818945', // #test
            '192712817957273600'  // #novi-intern
        ].includes(ch.id)
    )
}

// returns false if the command is not allowed in the given channel
const cmdAllowed = (ch, cmd) => isPublic(ch) ? !cmd.private : true

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

/* GIF implementations */

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
    'https://media1.tenor.com/images/a0ffacb83345fd02e0f5031c089fa9ec/tenor.gif',
    'https://media1.tenor.com/images/4d2163ca3f69e9a7dbd8f7b61bad493c/tenor.gif',
    'https://media1.tenor.com/images/07826ba9b2374136d44beccbae3af90d/tenor.gif',
    'https://media1.tenor.com/images/f3a58d4a10d31d0394af4c22a262d609/tenor.gif',
    'https://media1.tenor.com/images/4aa9de9c3e857647dd6b082c3d6f50b1/tenor.gif',
    'https://media1.tenor.com/images/f0bebce8599d83b6c20e5ffc44a7bd7f/tenor.gif',
    'https://media1.tenor.com/images/5431a2cae57e86c152fe05e6954b24b5/tenor.gif',
    'https://media.giphy.com/media/YVPh1GYFqJt6/giphy.gif',
    'https://media.giphy.com/media/LD8TdEcyuJxu0/giphy.gif',
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
    'https://media.giphy.com/media/DctClOfWhv1uw/giphy.gif',
    'https://media.giphy.com/media/TyedlhnUI6aNG/giphy.gif',
    'https://media.giphy.com/media/6dKnzQvvgpevK/giphy.gif',
    'https://media.giphy.com/media/XY6F8Aiy4biPS/giphy.gif',
    'https://media.giphy.com/media/GZVzBH1DnYOjK/giphy.gif',
    'https://media.giphy.com/media/iIPI1tpT9HcUE/giphy.gif',
    'https://media.giphy.com/media/PijznUhLmW56mJqfe6/giphy.gif'
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

const bangGIF = () => pick([
    'https://media1.tenor.com/images/cd6f458e203391c7c252bf0ce26476e4/tenor.gif',
    'https://media1.tenor.com/images/20da4935cdcac150717674b42c0e59b5/tenor.gif',
    'https://media1.tenor.com/images/fbba4cf24d2653cd0a86128baae60912/tenor.gif',
    'https://media1.tenor.com/images/32fd80acd1244459e704224cd359cc29/tenor.gif',
    'https://media1.tenor.com/images/246e5593679a3b30da8463965a6c1909/tenor.gif',
    'https://media1.tenor.com/images/0bb66ac9020a7498bc3be6839b99e4ec/tenor.gif',
    'https://media1.tenor.com/images/639b646417ac2fb1c131d606e692386e/tenor.gif',
    'https://media1.tenor.com/images/7b9ba26420ca0a3a65abb40d84894ea9/tenor.gif',
    'https://media1.tenor.com/images/ddecb500718a7dd81d1eefd1e46e3622/tenor.gif',
    'https://media1.tenor.com/images/854e74a01996351925dc3028803dadd7/tenor.gif',
    'https://media1.tenor.com/images/5a48b6a80d7025faa88a1f971def3b2e/tenor.gif',
    'https://media.giphy.com/media/yms4CB47nHnos/giphy.gif',
    'https://media.giphy.com/media/3o6Zt0IkvJwtFwWVjO/giphy.gif',
    'https://media.giphy.com/media/dImKd0zOtAqCQ/giphy.gif',
    'https://media.giphy.com/media/JBb9ldSXVkwF2/giphy.gif',
    'https://media.giphy.com/media/mu0jJS92IvvEc/giphy.gif',
    'https://media.giphy.com/media/EAbBeY9sDZhPq/giphy.gif',
    'https://media.giphy.com/media/11Eg4iRnkb4JkA/giphy.gif'
])

const sexyGIF = () => pick([
    'https://media.giphy.com/media/cwHQOWenYfnQA/giphy.gif',
    'https://media.giphy.com/media/12WgrmWEDsKN7q/giphy.gif',
    'https://media.giphy.com/media/Pd67q39KIdy4E/giphy.gif',
    'https://media.giphy.com/media/lWP8BbzlC0WS4/giphy.gif',
    'https://media1.giphy.com/media/fBjm5CS40P1ra/giphy.gif'
])
