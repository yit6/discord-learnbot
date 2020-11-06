const config = require('./config.json');
const discord = require('discord.js');
const client = new discord.Client();
const fs = require('fs');

const { make_question } = require('./utils/string_utils');

/**
 * Global Variables
 */
const ORIGINAL = JSON.parse(fs.readFileSync("db.json").toString());
const CURR_DB = ORIGINAL;
/** @type { {yes: Object | string, no: Object | string, question: string } } */
let curr_question = ORIGINAL;   // The current question that is being asked
let user_answers = [];          // The path of answers given by users in the Discord chat.
let mode = 0;                   //
let added = undefined;          //
let animal = undefined;         // 

/**
 * JSON Object keys/ids for yes/no in db.json, makes code easier to read, also makes it possible
 * to easily change "yes" & "no" to some other values.
 */
const YES_KEY = "yes";
const NO_KEY = "no";

function reset_curr_question() {
    curr_question = CURR_DB;
}


client.on('message', message => {
    if (message.author.bot) return;
    if (message.content === 'reset') {
        reset_curr_question()
        mode = 0;
    }

    /**
     * Mode 0 (Recursive): asks a question that any user in the Discord can answer to, initiating the next response.
     * Continues this process until the bot is directed onto a JSON object key(which represents an animal and not a question)
     * 
     * When this happens the bot either ends the game or prompts the users inside a Discord chat to input a yes + no question
     * to differentiate the animal the users thought of from the animal the bot reached in the node tree.
     */
    else if (mode === 0) {
        if (message.content === 'hello') {
            user_answers = [];
            message.channel.send(make_question(curr_question.question));
        }

        /**
         * If a Discord user answers yes to a presented question.
         */
        if (/^(y|yes)/.test(message.content)) {
            if (typeof curr_question === "string") {
                message.channel.send("I win!");
                reset_curr_question()
            }
            else {
                if (typeof curr_question.yes === "string") {
                    message.channel.send(`Is it a ${curr_question.yes}?`);
                    curr_question = curr_question.yes;
                    user_answers.push(YES_KEY);
                } else if (curr_question.yes.question) {
                    message.channel.send(make_question(curr_question.yes.question));
                    curr_question = curr_question.yes
                    user_answers.push(YES_KEY);
                } else {
                    throw new Error("Error, no 'question string' for the current 'yes' response was found, there is likely a typo error in your code!");
                }
            }
        }

        const test = {
            q: "brown?",
            yes: {
                q: "bear?",
                y: "bear",
                n: "dinosaur"
            },
            no: {
                q: "lizard?",
                y: "lizard",
                n: "human"
            }
        }

        /**
         * If a Discord user answers no to a presented question.
         */
        if (/^(n|no)/.test(message.content)) {
            if (typeof curr_question === "string") {
                message.channel.send("You win, what was it?");
                mode = 1;
            } else {
                if (typeof curr_question.no === "string") {
                    message.channel.send(`Is it a ${curr_question.no}?`);
                    curr_question = curr_question.no;
                    user_answers.push(NO_KEY);
                } else if (curr_question.no.question) {
                    message.channel.send(make_question(curr_question.no.question));
                    curr_question = curr_question.no;
                    user_answers.push(NO_KEY);
                } else {
                    throw new Error("Error, no 'question string' for the current 'no' response was found, there is likely a typo error in your code!");
                }
            }
        }
    }


    /**
     * Mode 1: prompts the users in a Discord chat to enter the animal they were thinking of. Takes the first non-bot
     * response and changes to Mode 2.
     */
    else if (mode === 1) {
        animal = message.content;
        message.channel.send(`What is a yes or no question to tell the difference between a __**${curr_question}**__ and a __**${animal}**__?`);
        mode = 2;
    }

    /**
     * Mode 2: prompts the users in a Discord chat to enter a question to tell the difference between the animals.
     */
    else if (mode === 2) {
        added = { question: message.content };
        message.channel.send(`What is the answer for ${curr_question}?`);
        mode = 3;
    }

    /**
     * Mode 3: asks the chat answers for the question.
     */
    else if (mode === 3) {
        /**
         * This code creates an object to modify the current animal.
         */
        if (/^(y|yes)/.test(message.content)) {
            added = { question: make_question(added.question), yes: curr_question, no: animal };
        }
        else if (/^(n|no)/.test(message.content)) {
            added = { question: make_question(added.question), yes: animal, no: curr_question };
        }

        /**
         * Sends a response message to a Discord channel to 
         */
        message.channel.send(`Question: ${added.question}
        ${added.yes}, YEP ✅
        ${added.no}, NOPE ❌`);
        // TODO: Add a confirm section here, and if it fails reset to mode 1.
        
        
        /**
         * Goes through the node map of animals and gets to the node depth
         * of the "yes"/"no" question minus 1.
         * 
         * Then sets the "yes"/"no" value to the new added object
         */
        let node_pointer = CURR_DB;
        const NODE_DEPTH = user_answers.length - 1;
        for(let i = 0; i < NODE_DEPTH; i++) {
            node_pointer = node_pointer[user_answers[i]];
        }
        node_pointer[user_answers[NODE_DEPTH]] = added;

        /**
         * Writes the updated database of animals to a JSON file.
         */
        const DATABASE_FILE = fs.createWriteStream('./db.json');
        DATABASE_FILE.write(JSON.stringify(CURR_DB));
        DATABASE_FILE.close();

        reset_curr_question()
        mode = 0;
    }
    if (message.content === 'debug') {
        message.channel.send(JSON.stringify(curr_question));
    }
});

client.login(config.token);
