var backend = {
    getCommands: () => {
        let result = {}
        let commandsCollection = db.collection('commands')
        let search = commandsCollection.find({});
        search.forEach(command => {
            result[command.name] = command;
        });
        return result;
    },
    getServerInfo: () => {
        let result = {}
        let queueCollection = db.collection('queues')
        let serversCollection = db.collection('servers');
        
        let search = serversCollection.find({status: 1});
        search.forEach(server => {
            let thisServer = {
                testing: false,
                queueing: false,
                users: {},
                queue: [],
                lastStack: [],
                log: []
            };

            let queueSearch = queueCollection.find({serverId: server.discordId})
            queueSearch.forEach(entry => {
                thisServer.queue.push(entry)
            })


            state[server.discordId] = thisServer;
        })

        return result;
    },
    saveServer: (id) => {
        state[id] = {
            testing: false,
            queueing: false,
            users: {},
            queue: [],
            lastStack: [],
            log: []
        };
    },
};


module.exports = backend;