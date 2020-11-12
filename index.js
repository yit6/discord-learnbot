const config = require('./config.json');
const discord = require('discord.js');
const client = new discord.Client();
const fs = require('fs');

const { make_question } = require('./utils/string_utils');

/**
 * Global Variables
 */
const ORIGINAL = JSON.parse(fs.readFileSync("db.json").toString());
/** @type { {yes: Object | string, no: Object | string, question: string } } */
let curr_question = ORIGINAL;   // The current question that is being asked
let mode = 0;                   //
let added = undefined;          //
let animal = undefined;         // 

client.on('message', message => {
    if (message.author.bot) return;
    if (message.content === 'reset') {
        curr_question = ORIGINAL;
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
            // console.log(curr_question.question)
            message.channel.send(make_question(curr_question.question));
        }

        /**
         * If a Discord user answers yes to a presented question.
         */
        if (/(y|yes)/.test(message.content)) {
            if (typeof curr_question === "string") {
                message.channel.send("I win!");
                curr_question = ORIGINAL;
            }
            else {
                if (typeof curr_question.yes === "string") {
                    message.channel.send(`Is it a ${curr_question.yes}?`);
                    curr_question = curr_question.yes;
                } else if(curr_question.yes.question) {
                    message.channel.send(make_question(curr_question.yes.question));
                    curr_question = curr_question.yes
                }
            }
        }

        /**
         * If a Discord user answers no to a presented question.
         */
        if (/(n|no)/.test(message.content)) {
            if (typeof curr_question === "string") {
                message.channel.send("You win, what was it?");
                mode = 1;
            } else {
                if (typeof curr_question.no === "string") {
                    message.channel.send(`Is it a ${curr_question.no}?`);
                    curr_question = curr_question.no;
                } else if(curr_question.no.question) {
                    message.channel.send(make_question(curr_question.no.question));
                    curr_question = curr_question.no;
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
        message.channel.send(`What is a yes or no question to tell the difference between a ${curr_question} and a ${animal}`);
        mode = 2;
    }

    /**
     * Mode 2: prompts the users in a Discord chat to enter the animal they were thinking of.
     */
    else if (mode === 2) {
        added = { question: message.content };
        message.channel.send(`What is the answer for ${curr_question}`);
        mode = 3;
    }

    /**
     * Mode 3: IDK
     */
    else if (mode === 3) {
        /**
         * This code creates an object to modify the current animal.
         */
        if (/(y|yes)/.test(message.content)) {
            added = { question: added.question, yes: make_question(curr_question), no: animal };
        }
        else if (/(n|no)/.test(message.content)) {
            added = { question: added.question, yes: animal, no: make_question(curr_question) };
        }
        console.log(added);
        message.channel.send(`Question: ${added.question}?
        Yes: ${added.yes}
        No: ${added.no}`);
        mode = 0;
        curr_question = ORIGINAL;
    }
    if (message.content === 'debug') {
        message.channel.send(JSON.stringify(curr_question));
    }
});

client.login(config.token);
