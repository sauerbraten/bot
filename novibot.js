const Discord = require("discord.js");
const fetch = require("node-fetch");
const HTMLParser = require("node-html-parser");
const WebSocket = require("ws");

/* commands set-up */

const commands = {
  "!abfahrt": makeCmd(abfahrt, "let me show you something!"),
  "!fml": makeCmd(fml, "gives you a random post from fmylife.com"),
  "!help": makeCmd(help, "shows this help text"),
  "!ping": makeCmd(ping, "makes the bot reply with a pong"),
  "!quiz": makeCmd(quiz, "starts a 15-questions quiz about general knowledge"),
  "!rev": makeCmd(revision, "show git revision of this bot instance"),
  "!sex": makeCmd(sex, "probably makes you wet", true),
  "!slap": makeCmd(slap, "slap a mate"),
  "!status": makeCmd(status, "displays the current state of a sauer server"),
  "!vengavenga": makeCmd(vengavenga, "let me show you something!"),
  "!whois": makeCmd(whois, "looks up the name at chef.p1x.pw"),
};

/* actual bot stuff */

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.log("Provide a discord bot token as DISCORD_TOKEN!");
  return;
}

const bot = new Discord.Client();

bot.on("ready", () => {
  console.log(`Logged in as ${bot.user.tag}!`);
  // notify #novi-intern about restart (but only if the name doesn't indicate a test bot account)
  if (
    !bot.user.username
      .split(" ")
      .some((part) =>
        ["alpha", "beta", "pre", "test"].some((word) => part.includes(word))
      )
  ) {
    bot.channels
      .get("192712817957273600")
      .send(
        `On to a fresh start with revision ${git.hash}! :rocket:`,
        gitEmbed
      );
  }
});

bot.on("message", (msg) => {
  if (msg.author.bot) {
    // do not react to bot messages (including this bot's own messages)
    return;
  }

  const cmd = commands[msg.content.split(" ")[0].toLowerCase()];
  if (cmd === undefined) {
    // if there is no command matching the first message token, do nothing
    return;
  }

  if (!cmdAllowed(msg.channel, cmd)) {
    // don't react to private commands in public channels
    return;
  }

  // execute the function implementing the command
  cmd.f(msg);
});

bot.on("error", console.error);

bot.login(token);

/* command implementations */

function slap(msg) {
  switch (msg.mentions.users.size) {
    case 0:
      msg.channel.send(
        `${msg.author} flops around a bit like a large trout!`,
        new Discord.MessageEmbed().setImage(flopGIF())
      );
      break;
    case 1:
      if (msg.mentions.users.first() == msg.author) {
        msg.channel.send(
          `${msg.author} flops around a bit like a large trout!`,
          new Discord.MessageEmbed().setImage(flopGIF())
        );
      } else {
        msg.channel.send(
          `${
            msg.author
          } slaps ${msg.mentions.users.first()} around a bit with a large trout!`,
          new Discord.MessageEmbed().setImage(slapGIF())
        );
      }
      return;
    default:
      msg.reply("one at a time, please!");
      return;
  }
}

function sex(msg) {
  switch (msg.mentions.users.size) {
    case 0:
      msg.channel.send(
        `${msg.author} wants to have some sexy time! :smirk:`,
        new Discord.MessageEmbed().setImage(sexyGIF())
      );
      break;
    case 1:
      if (msg.mentions.users.first() == msg.author) {
        msg.channel.send(`You can not bang yourself, my friend! :eyes:`);
      } else {
        msg.channel.send(
          `${
            msg.author
          } wants to bang ${msg.mentions.users.first()} :eggplant: :peach:`,
          new Discord.MessageEmbed().setImage(bangGIF())
        );
      }
      return;
    default:
      msg.reply("several at once? Keep cool, playboy.");
      return;
  }
}

function vengavenga(msg) {
  msg.reply("https://youtu.be/MT7dbmV_-ek?t=16");
}

function abfahrt(msg) {
  msg.reply("https://www.youtube.com/watch?v=bfVK9z7BlUM");
}

function ping(msg) {
  msg.reply("pong! :ping_pong:");
}

function fml(msg) {
  const url = "https://www.fmylife.com/random";
  fetch(url)
    .then((response) => {
      response.text().then((html) => {
        const root = HTMLParser.parse(html);
        const firstPost = root
          .querySelector(".panel .article-contents a.article-link")
          .text.trim();
        msg.channel.send(firstPost);
      });
    })
    .catch((err) => {
      console.error(err);
      msg.reply(`I couldn't fetch ${url}!`);
    });
}

function whois(msg) {
  let parts = msg.content.split(" ");
  if (parts.length != 2) {
    msg.reply(
      "please provide exactly one name, for example: `!whois player1`."
    );
    return;
  }
  // parts[0] is the '!whois', our query is parts[1]
  const url = `https://chef.p1x.pw/lookup?q=${encodeURI(
    parts[1]
  )}&sorting=name_frequency`;
  const apiURL = `https://chef.p1x.pw/api/lookup?q=${encodeURI(
    parts[1]
  )}&sorting=name_frequency`;
  fetch(apiURL)
    .then((response) => {
      response.json().then((json) => {
        const uniques = json.results
          .map((r) => Discord.escapeMarkdown(r.name)) // extract name from each result
          .filter((v, i, names) => names.indexOf(v) === i) // discard duplicates (= keep uniques)
          .slice(0, 5); // max. 5 results
        const query = Discord.escapeMarkdown(json.query);
        if (uniques.length === 0) {
          msg.channel.send(
            `I could not find any results for *${query}*! ${noResultsEmoji()}`
          );
        } else {
          msg.channel.send(
            `Results for *${query}*: ${uniques.join(", ")}. More at: <${url}>`
          );
        }
      });
    })
    .catch((err) => {
      console.error(err);
      msg.reply(`I couldn't fetch ${apiURL}!`);
    });
}

function help(msg) {
  msg.channel.send(
    "Available commands:\n" +
      Object.entries(commands) // convert commands object to array of key-value pairs, e.g. [ ['!ping', {f: ping, desc: '...'}], ['!fml', {f: fml, desc: '...'}] ]
        .filter((c) => cmdAllowed(msg.channel, c[1])) // when the !help command came from a public channel, filter out the private commands (otherwise let all commands through the filter)
        .map((c) => `${c[0]} - ${c[1].desc}`) // from each key-value pair, generate a string like this '<key> - <desc field from value>' (key is first element in key-value pair array, value is second)
        .join("\n") // join all the strings by putting newlines inbetween them
  );
}

function revision(msg) {
  msg.reply(`I'm running revision ${git.hash}. :tools:`, gitEmbed);
}

function status(msg) {
  const query = msg.content.slice("!status".length).trim();
  if (query === "") {
    msg.reply("I need a server name!");
    return;
  }
  const apiURL = `https://chef.p1x.pw/api/server?q=${encodeURI(query)}`;
  fetch(apiURL)
    .then((response) => {
      response
        .json()
        .then((results) => {
          const server = results
            .filter((s) => s.last_seen) // discard servers without the 'last_seen' field
            .sort((s, t) => s.last_seen < t.last_seen) // sort by what server was most recently seen
            .shift(); // we only want one result
          if (!server) {
            msg.reply(`I could not find a server named *${query}*!`);
            return;
          }
          const wsURL = `wss://extinfo.p1x.pw/server/${server.ip}:${server.port}`;
          const ws = new WebSocket(wsURL);
          ws.on("error", (err) => {
            console.error(err);
            msg.reply(`I couldn't connect to ${wsURL}!`);
          });
          ws.on("message", (data) => {
            ws.close(); // we only need one frame
            const i = JSON.parse(data).serverinfo;
            const singular = i.numberOfClients === 1;
            msg.channel.send(
              `There ${singular ? "is" : "are"} ${i.numberOfClients} player${
                singular ? "" : "s"
              } on ${i.description}, playing ${i.gameMode} on ${
                i.map
              } with ${formatTimeLeft(i.secsLeft)} left (${
                i.masterMode
              }). More at <https://extinfo.p1x.pw/#${server.ip}:${server.port}>`
            );
          });
        })
        .catch((err) => {
          console.error(err);
          msg.reply(`${apiURL} did not return valid JSON!`);
        });
    })
    .catch((err) => {
      console.error(err);
      msg.reply(`I couldn't fetch ${apiURL}!`);
    });
}

function quiz(msg) {
  const channel = msg.channel;
  const ranking = {};
  let question = undefined;
  let askedAt = undefined;
  let hints = [];
  const maxHints = 4;
  const timeBetweenHints = 15000;
  let solution = undefined;
  let answerHandler = undefined;

  function ask() {
    answerHandler = makeAnswerHandler();
    bot.on("message", answerHandler);
    channel.send(
      `**Question ${question.number}** is from *${
        question.category
      }*: ${htmlDecode(question.question)} :thinking:`
    );
    askedAt = new Date();
    hints = [];
    solution = undefined;
    const answer = htmlDecode(question.correct_answer);
    scheduleHints(answer);
    scheduleSolution(answer);
  }

  function scheduleHints(answer) {
    const wordChars = /[a-zA-Z0-9äöüß]/g;
    const nonWordChars = /[^a-zA-Z0-9äöüß]/g;
    const alphaNumOnlyAnswer = answer.replace(nonWordChars, "");
    // pad pads s with 'a' so the amount of matched chars is divisible by maxHints
    const pad = (s) =>
      s + "a".repeat(maxHints - (s.match(wordChars).length % maxHints));
    // maskRegex builds a regex that matches maxHints word chars; provides capture groups
    // for the part that should remain clear text and the part that should be masked with '*'
    const maskRegex = (num) =>
      new RegExp(
        `((${nonWordChars.source}*${wordChars.source}){${num}})((${
          nonWordChars.source
        }*${wordChars.source}){${maxHints - num}})`,
        "g"
      );
    // mask pads s, applies mask, then trims s
    const mask = (s, num) =>
      pad(s)
        .replace(
          maskRegex(num),
          (_, clear, __, masked) => `${clear}${masked.replace(wordChars, "*")}`
        )
        .slice(0, s.length);
    const hint = (num) => {
      let h = mask(alphaNumOnlyAnswer, num);
      let charsBefore = 0;
      const charsBetweenSpaces = answer
        .split(/[^a-zA-Z0-9äöüß]/)
        .map((s) => s.length);
      for (const gap of charsBetweenSpaces) {
        h = h.slice(0, charsBefore + gap) + " " + h.slice(charsBefore + gap);
        charsBefore += gap + 1;
      }
      h = h.slice(0, answer.length);
      return h;
    };

    const startMask = alphaNumOnlyAnswer.length == 1 ? 0 : 1; // one-character answers get a '*' hint
    const numHints = Math.min(alphaNumOnlyAnswer.length, maxHints);
    for (let numMask = startMask; numMask < numHints; numMask++) {
      hints.push(
        setTimeout(
          () => channel.send(`Hint: \`${hint(numMask)}\``),
          (hints.length + 1) * timeBetweenHints
        )
      );
    }
  }

  function cancelHints() {
    for (let hint of hints) {
      clearTimeout(hint);
    }
    hints = [];
  }

  function scheduleSolution(answer) {
    solution = setTimeout(() => {
      bot.off("message", answerHandler);
      channel.send(
        `The answer would have been: *${Discord.escapeMarkdown(
          answer
        )}*. :rolling_eyes:`
      );
      afterQuestion();
    }, (hints.length + 1) * timeBetweenHints);
  }

  function cancelSolution() {
    if (solution) {
      clearTimeout(solution);
    }
    solution = undefined;
  }

  function htmlDecode(question) {
    return HTMLParser.parse(`<p>${question}</p>`).text;
  }

  function makeAnswerHandler() {
    return function (answer) {
      if (answer.channel != channel) {
        // discard messages in other channels than where this quiz is played
        return;
      }
      if (answer.author.bot) {
        // do not react to bot messages (including this bot's own messages)
        return;
      }

      const correctAnswer = new RegExp(
        question.correct_answer
          .replace(/\s/, "\\s?") // whitespace is optional
          .replace(/(\D)\W(\D)/, "$1\\W?$2"), // non-word characters (punctuation etc.) are optional (except '.' in numerals)
        "ig" // ignore case & match globally
      );
      if (!correctAnswer.test(answer.content)) {
        return;
      }
      // we have a correct answer!
      // stop handling answers
      bot.off("message", answerHandler);
      // stop hints/solution
      cancelHints();
      cancelSolution();
      if (!ranking[answer.author.username]) {
        ranking[answer.author.username] = 1;
      } else {
        ranking[answer.author.username]++;
      }
      channel.send(
        `${answer.author.username} solved after ${
          (new Date() - askedAt) / 1000
        } seconds. :tada:\nThe answer was: *${htmlDecode(
          question.correct_answer
        )}*`
      );
      afterQuestion();
    };
  }

  function afterQuestion() {
    let haveWinner = false;
    for (let name in ranking) {
      if (ranking[name] == 10) {
        haveWinner = true;
        break;
      }
    }
    if (haveWinner || !question.next) {
      // after 1 second, send final stats
      setTimeout(() => {
        channel.send(
          `Final scores:\n\n${sortedRanking()
            .map(
              (r, i) =>
                `${i + 1}. ${r.name}: ${r.points} ${
                  r.points == 1 ? "point" : "points"
                }`
            )
            .join("\n")}`
        );
      }, 1000);
    } else {
      question = question.next;
      // after 1 second, show current top 3
      setTimeout(() => {
        const top3 = sortedRanking().slice(0, 3);
        if (!top3.length) {
          return;
        }
        channel.send(
          `Top ${top3.length == 1 ? "player" : top3.length}: ${top3
            .map(
              (r) =>
                `${r.name} (${r.points} ${r.points == 1 ? "point" : "points"})`
            )
            .join(", ")}`
        );
      }, 1000);
      // after 11 seconds (10 seconds after the top 3), ask the next question
      setTimeout(ask, 11000);
    }
  }

  const sortedRanking = () => {
    let sorted = [];
    for (let name in ranking) {
      sorted.push({ name, points: ranking[name] });
    }
    sorted.sort((a, b) => b.points - a.points); // sort by points in descending order
    return sorted;
  };

  fetch("https://opentdb.com/api.php?amount=30&type=multiple").then(
    (response) => {
      response.json().then((json) => {
        if (!json.results || !json.results.length) {
          console.error(json);
          msg.reply(`I got an unexpected response from ${url}!`);
          return;
        }
        const questions = json.results
          .filter(
            (q) =>
              !/(which one|which of (these|the following))/gi.test(q.question)
          ) // remove questions that depend on the possible answers
          .slice(0, 15); // only keep 15 questions
        // link questions from last to first
        let i = 15;
        for (let q of questions) {
          q.number = i;
          q.next = question;
          question = q;
          i--;
        }
        // start at the last question
        ask();
      });
    }
  );
}

/* utility functions */

// takes a command implementation and a description string and
// returns an object, e.g. {f: ping, desc: '...'}
function makeCmd(f, desc, private = false) {
  return {
    f: f, // the function implementing the command
    desc: desc, // a description (used for help text)
    private: private, // wether or not this command is available in public channels
  };
}

// returns true when channel is not a DM channel and not in the predefined set of private channels
function isPublic(ch) {
  if (ch instanceof Discord.DMChannel) {
    // DM chats are never public
    return false;
  }

  return ![
    "536858354404818945", // #test
    "192650756434690048", // #novi-offtopic
    "478315034561216512", // #chit-chat
    "192712817957273600", // #novi-intern
  ].includes(ch.id);
}

// returns false if the command is not allowed in the given channel
const cmdAllowed = (ch, cmd) => (isPublic(ch) ? !cmd.private : true);

// formats e.g. 317 as '05:17'
function formatTimeLeft(seconds) {
  const pad = (i) => (i < 10 ? "0" : "") + i;
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

// randomly picks one element from arr and returns it
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const noResultsEmoji = () =>
  pick([
    ":zipper_mouth:",
    ":worried:",
    ":frowning2:",
    ":slight_frown:",
    ":pensive:",
    ":frowning:",
    ":thinking:",
    ":shrug:",
    ":cry:",
    ":sob:",
    ":no_mouth:",
  ]);

/* GIF implementations */

const slapGIF = () =>
  pick([
    "https://media1.tenor.com/images/089a3adeec46220ead9879ba0b2e4703/tenor.gif",
    "https://media1.tenor.com/images/bdab32a7f54cd76ad132242bdcbad632/tenor.gif",
    "https://media1.tenor.com/images/7cff4fbe930bf280320f2e94978e2a94/tenor.gif",
    "https://media1.tenor.com/images/29cb608d5818c0bef2b7856a24f4c7f8/tenor.gif",
    "https://media1.tenor.com/images/3d791718475c30c00b665ac64b3ebaa4/tenor.gif",
    "https://media1.tenor.com/images/6480ef9483acd7c11f7fbd9bf3564391/tenor.gif",
    "https://media1.tenor.com/images/5d7c8fd4025eb5c62d7d1076287ba9ae/tenor.gif",
    "https://media1.tenor.com/images/be29fa0f5084551c36d0d5975cf6bf0a/tenor.gif",
    "https://media.tenor.com/images/a3664bd5936a6b49a8657449cdaba463/tenor.gif",
    "https://media1.tenor.com/images/312b5192fb1e4f5f03b4ab845212f83d/tenor.gif",
    "https://media1.tenor.com/images/6984543808009c6e289c903a5b661674/tenor.gif",
    "https://media1.tenor.com/images/a0ffacb83345fd02e0f5031c089fa9ec/tenor.gif",
    "https://media1.tenor.com/images/4d2163ca3f69e9a7dbd8f7b61bad493c/tenor.gif",
    "https://media1.tenor.com/images/07826ba9b2374136d44beccbae3af90d/tenor.gif",
    "https://media1.tenor.com/images/f3a58d4a10d31d0394af4c22a262d609/tenor.gif",
    "https://media1.tenor.com/images/4aa9de9c3e857647dd6b082c3d6f50b1/tenor.gif",
    "https://media1.tenor.com/images/f0bebce8599d83b6c20e5ffc44a7bd7f/tenor.gif",
    "https://media1.tenor.com/images/5431a2cae57e86c152fe05e6954b24b5/tenor.gif",
    "https://media.giphy.com/media/YVPh1GYFqJt6/giphy.gif",
    "https://media.giphy.com/media/LD8TdEcyuJxu0/giphy.gif",
    "https://media.giphy.com/media/mEtSQlxqBtWWA/giphy.gif",
    "https://media.giphy.com/media/O3ao5CGUL7FK0/giphy.gif",
    "https://media.giphy.com/media/QVYiiemqUEe9q/giphy.gif",
    "https://media.giphy.com/media/j3iGKfXRKlLqw/giphy-downsized.gif",
    "https://media.giphy.com/media/UHLtCLwRsbDFK/giphy-downsized.gif",
    "https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
    "https://media.giphy.com/media/1zgOyLCRxCmV5G3GFZ/giphy.gif",
    "https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif",
    "https://media.giphy.com/media/Blsb9lFTZr54s/giphy.gif",
    "https://media.giphy.com/media/l2SpSQLpViJk9vhmg/giphy.gif",
    "https://media.giphy.com/media/q8AiNhQJVyDoQ/giphy.gif",
    "https://media.giphy.com/media/l0MYthTiOGtg1zsT6/giphy.gif",
    "https://media.giphy.com/media/3oEdv1Rdmo0Vd0YdW0/giphy.gif",
    "https://media.giphy.com/media/bGnQmK38QoSg8/giphy.gif",
    "https://media.giphy.com/media/s5zXKfeXaa6ZO/giphy.gif",
    "https://media.giphy.com/media/siS34ziU0gxsQ/giphy.gif",
    "https://media.giphy.com/media/8TpEwyNgVypZm/giphy.gif",
    "https://media.giphy.com/media/3o7TKPlA0hb9Oj2SqY/giphy.gif",
    "https://media.giphy.com/media/nq0qLlrcdahiw/giphy.gif",
    "https://media.giphy.com/media/1125FQpCo6Ubhm/giphy.gif",
    "https://media.giphy.com/media/DctClOfWhv1uw/giphy.gif",
    "https://media.giphy.com/media/TyedlhnUI6aNG/giphy.gif",
    "https://media.giphy.com/media/6dKnzQvvgpevK/giphy.gif",
    "https://media.giphy.com/media/XY6F8Aiy4biPS/giphy.gif",
    "https://media.giphy.com/media/GZVzBH1DnYOjK/giphy.gif",
    "https://media.giphy.com/media/iIPI1tpT9HcUE/giphy.gif",
    "https://media.giphy.com/media/PijznUhLmW56mJqfe6/giphy.gif",
  ]);

const flopGIF = () =>
  pick([
    "https://media.giphy.com/media/irU9BlmqEwZwc/giphy.gif",
    "https://media.giphy.com/media/xUPGcnzWmq70t1oJ8I/giphy.gif",
    "https://media.giphy.com/media/vqNDninByDpU4/giphy.gif",
    "https://media.giphy.com/media/3WvdC5etwu52rLUAWm/giphy.gif",
    "https://media.giphy.com/media/26FPnj46RYsIWgYLe/giphy.gif",
    "https://media.giphy.com/media/a57Xed7DfAkDe/giphy.gif",
    "https://media.giphy.com/media/pSJmEIjCeKmWI/giphy.gif",
    "https://media.giphy.com/media/sRe0TGUMzmqNW/giphy.gif",
    "https://media.giphy.com/media/3ohjUNypcf1MNkM7rW/giphy.gif",
    "https://media.giphy.com/media/3NWNbk6Ja391S/giphy.gif",
    "https://media.giphy.com/media/1LmU5cGjBR1pC/giphy.gif",
    "https://media.giphy.com/media/k9hKQMscB8DZe/giphy.gif",
  ]);

const bangGIF = () =>
  pick([
    "https://media1.tenor.com/images/cd6f458e203391c7c252bf0ce26476e4/tenor.gif",
    "https://media1.tenor.com/images/20da4935cdcac150717674b42c0e59b5/tenor.gif",
    "https://media1.tenor.com/images/fbba4cf24d2653cd0a86128baae60912/tenor.gif",
    "https://media1.tenor.com/images/32fd80acd1244459e704224cd359cc29/tenor.gif",
    "https://media1.tenor.com/images/246e5593679a3b30da8463965a6c1909/tenor.gif",
    "https://media1.tenor.com/images/0bb66ac9020a7498bc3be6839b99e4ec/tenor.gif",
    "https://media1.tenor.com/images/639b646417ac2fb1c131d606e692386e/tenor.gif",
    "https://media1.tenor.com/images/7b9ba26420ca0a3a65abb40d84894ea9/tenor.gif",
    "https://media1.tenor.com/images/ddecb500718a7dd81d1eefd1e46e3622/tenor.gif",
    "https://media1.tenor.com/images/854e74a01996351925dc3028803dadd7/tenor.gif",
    "https://media1.tenor.com/images/5a48b6a80d7025faa88a1f971def3b2e/tenor.gif",
    "https://media.giphy.com/media/yms4CB47nHnos/giphy.gif",
    "https://media.giphy.com/media/3o6Zt0IkvJwtFwWVjO/giphy.gif",
    "https://media.giphy.com/media/dImKd0zOtAqCQ/giphy.gif",
    "https://media.giphy.com/media/JBb9ldSXVkwF2/giphy.gif",
    "https://media.giphy.com/media/mu0jJS92IvvEc/giphy.gif",
    "https://media.giphy.com/media/EAbBeY9sDZhPq/giphy.gif",
    "https://media.giphy.com/media/11Eg4iRnkb4JkA/giphy.gif",
  ]);

const sexyGIF = () =>
  pick([
    "https://media1.tenor.com/images/08a71da82af77f2404dfe405e6be7889/tenor.gif",
    "https://media1.tenor.com/images/5e5a9c679db88d5df7b409451dbfe4a0/tenor.gif",
    "https://media1.tenor.com/images/34bd68ba1f7aa6fe10e56bc78d4c0b31/tenor.gif",
    "https://media1.tenor.com/images/a4aa5d4dc10686f1a83c23326ecbcd94/tenor.gif",
    "https://media1.tenor.com/images/b2e30fc7505e52edef137add329bd626/tenor.gif",
    "https://media1.tenor.com/images/9382b1a54b103c22cb3d125bca8254dd/tenor.gif",
    "https://media.giphy.com/media/cwHQOWenYfnQA/giphy.gif",
    "https://media.giphy.com/media/12WgrmWEDsKN7q/giphy.gif",
    "https://media.giphy.com/media/Pd67q39KIdy4E/giphy.gif",
    "https://media.giphy.com/media/lWP8BbzlC0WS4/giphy.gif",
    "https://media1.giphy.com/media/fBjm5CS40P1ra/giphy.gif",
    "https://media.giphy.com/media/mwAEs7loF7xqo/giphy.gif",
    "https://media.giphy.com/media/1266sbyhJZwgyk/giphy.gif",
    "https://media.giphy.com/media/10xs6XIt0Yy5Nu/giphy.gif",
    "https://media.giphy.com/media/O6G4pe7P5ZVCw/giphy.gif",
    "https://media.giphy.com/media/btZOJAcXRSWZi/giphy.gif",
    "https://media.giphy.com/media/xMbYC7zVHLiKY/giphy.gif",
    "https://media.giphy.com/media/xuMu0HuHlXiQ8/giphy.gif",
    "https://media.giphy.com/media/pYRYdnMICWmti/giphy.gif",
    "https://media.giphy.com/media/kgpuhoz8vW4RW/giphy.gif",
    "https://media.giphy.com/media/JOXHRcd3Llz5m/giphy.gif",
    "https://media1.giphy.com/media/upDkg42rRR6Wk/giphy.gif",
    "https://media.giphy.com/media/6D0dubMvJUtAA/giphy.gif",
    "https://media.giphy.com/media/NAEMN5qk3pEac/giphy.gif",
    "https://media.giphy.com/media/UkB4EFWdX9eJq/giphy.gif",
  ]);

const git = {
  hash: `<<hash>>`,
  author: `<<author>>`,
  subject: `<<subject>>`,
};

const gitEmbed = new Discord.MessageEmbed()
  .setAuthor(git.author)
  .setTitle(git.subject)
  .setDescription(`[sauerbraten/bot](https://github.com/sauerbraten/bot)`)
  .setURL(`https://github.com/sauerbraten/bot/commit/${git.hash}`);
//.setThumbnail('https://i.imgur.com/1KOip7T.png')
