const Discord = require("discord.js");
const _ = require('lodash');

client = new Discord.Client();
path = require('path');
config = require('./config')

// db = require('./classes/database');
// db.connect();

state = {}
var messageHandler = require('./handlers/messageHandler');


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', messageHandler.message);

function addUser(split, user) {
    var btag = ''
                    
    var roles = [];
    
    split.forEach(v => {
        if (v && v.indexOf('#') !== -1) {
            btag = v;
        }
        switch (v.toLowerCase()) {
            case 'dps':
            case 'int':
                v = 'damage';
            case 'support':
            case 'tank':
            case 'damage':
            case 'healer':
                roles.push(v);
        }
    })

    stack.push(user.id);
    users[user.id] = {user, btag, roles};
}

// db.end()

client.login(config.botKey);