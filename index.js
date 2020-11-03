const config = require('./config.json');
const discord = require('discord.js');
const client = new discord.Client();
client.once('ready',()=>{
	console.log('ready');
});
fs=require('fs');
var orig = JSON.parse(fs.readFileSync("db.json").toString());
var db = orig;
var mode = 0;
var added;
var animal;
client.on('message', message => {
	if (message.author.bot)	return;
	if (message.content=='reset') {
		db = orig;
		mode = 0;
	}
	else if (mode == 0) {
		if (message.content=='hello') {
			message.channel.send(db.question);
		}
		if (message.content=='y'||message.content=='yes') {
			if (typeof db == "string") {
				message.channel.send("I win");	
				db = orig;
			}
			else {
				if (typeof db.yes == "string") { 
					message.channel.send("Is it a "+db.yes);
					db = db.yes;
				} else {
					message.channel.send(db.yes.question);
					db = db.yes
				}
			}
		}
		if (message.content=='n'||message.content=='no') {
			if (typeof db == "string" ) {
				message.channel.send("You win, what was it");
				mode = 1;
			} else {
				if (typeof db.no=="string") {
					message.channel.send("Is it a "+db.no);
					db = db.no;
				} else {
					message.channel.send(db.no.question);
					db = db.no;
				}
			}
		}
	}
	else if (mode == 1) {
		animal = message.content;
		message.channel.send("What is a yes or no question to tell the difference between a "+db+" and a "+animal);
		mode = 2;
	}
	else if (mode == 2) {
		added = {question:message.content};
		message.channel.send("What it the answer for "+db);
		mode = 3;
	}
	else if (mode == 3) {
		if (message.content=="yes" || message.content=="y") {
			added = {question:added.question, yes:db, no:animal};
		}
		if (message.content=="n" || message.content=="no") {
			added = {question:added.question, yes:animal, no:db};
		}
		console.log(added);
		message.channel.send(added.question+"? "+added.yes+" yes, "+added.no+" no.");
		mode = 0;
		db = orig;
	}
	if (message.content=='debug') {
		message.channel.send(JSON.stringify(db));
	}
});
client.login(config.token);
