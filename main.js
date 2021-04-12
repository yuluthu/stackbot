const Discord = require("discord.js");
const _ = require('lodash');
const { MongoClient } = require("mongodb");
discordClient = new Discord.Client();
path = require('path');
config = require('./config')


let uri = 'mongodb://' + config.mongo.username + ':' + config.mongo.password + '@' + config.mongo.host + ':' + config.mongo.port + '?retryWrites=true&writeConcern=majority';
dbClient = new MongoClient(uri);
async function run() {
    try {
        await dbClient.connect();
        db = dbClient.db(config.mongo.database)

        backend = require('./handlers/backend');

        var messageHandler = require('./handlers/messageHandler');

        discordClient.on('ready', () => {
          console.log(`Logged in as ${discordClient.user.tag}!`);
        });
        
        discordClient.on('message', messageHandler.message);
        
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
        discordClient.login(config.botKey);
    } finally {
    }  
}    

run().catch(console.dir)