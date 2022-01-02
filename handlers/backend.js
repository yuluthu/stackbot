const config = require("../config");

var backend = {
    getCommands: () => {
        let result = {}
        let commandsCollection = db.collection('commands')
        let search = commandsCollection.find({});
        search.forEach(command => {
            command.aliases = [];
            result[command.name] = command;
        });

        result.sort((x, y) => {
            if (x.isAdmin && !y.isAdmin) {
                return 1;
            }

            if (!x.isAdmin && y.isAdmin) {
                return -1;
            }

            return 0;
        })
        return result;
    },
    getServerRoles: async (serverId) => {
        let rolesCollection = db.collection('admin_roles');
        let roles = await rolesCollection.find({serverId}).toArray();
        config.adminUserRoles[serverId] = roles.map(v => v.roleId);
        return true;
    },
    isStacking: async (serverId) => {
        let serversCollection = db.collection('servers');
        let server = await serversCollection.findOne({serverId});
        if (server) {
            return server.stacking;
        }
        backend.saveServer(serverId);
        return false;
    },
    getQueue: (serverId, count, noDefer) => {
        let queuesCollection = db.collection('queues')
        let options = {sort: {priority: -1, dateJoined: 1}};
        if (count) {
            options.limit = count;
        }

        let filters = {serverId};

        if (noDefer === true) {
            filters.priority = {$lt: 3};
        }

        var search = queuesCollection.find(filters, options);

        return search.toArray();

    },
    removeFromQueue: async (serverId, userId) => {
        let queuesCollection = db.collection('queues')

        let search = await queuesCollection.findOne({serverId, user: userId});
        if (!search) {
            return false;
        }
        queuesCollection.deleteOne({serverId, user: userId})

        return true;
    },
    designateRole: async (serverId, roleId) => {
        let rolesCollection = db.collection('admin_roles');
        let role = await rolesCollection.findOne({serverId, roleId});
        if (!role) {
            rolesCollection.insertOne({serverId, roleId});
            return true;
        }
        return false
    }, 
    removeRole: async (serverId, roleId) => {
        let rolesCollection = db.collection('admin_roles');
        let role = await rolesCollection.findOne({serverId, roleId});
        if (role) {
            rolesCollection.removeOne({serverId, roleId});
            return true;
        }
        return false
    },
    addToQueue: async (serverId, user, priority) => {
        if (priority == undefined) {
            priority = 0
        }

        if (user.user) {
            user = user.user
        }

        let queuesCollection = db.collection('queues')
        let selector = {serverId, user: user.id};
        let search = await queuesCollection.findOne(selector);
        if (search) {
            queuesCollection.updateOne(selector, {$set: {priority}})
            return false;
        }
        queuesCollection.insertOne({user: user.id, name: user.username, priority: priority, serverId, dateJoined: new Date()})

        return true;
    },
    startQueue: async (serverId) => {
        let serversCollection = db.collection('servers')
        let search = await serversCollection.findOne({serverId});
        if (search) {
            if (search.stacking) {
                return false;
            }
        } else {
            await backend.saveServer(serverId);
        }
        await serversCollection.updateOne({serverId}, {$set: {stacking: true}});
        return true
    },
    clearQueue: async (serverId) => {
        let queuesCollection = db.collection('queues')

        let search = await queuesCollection.findOne({serverId});
        if (!search) {
            return false;
        }
        queuesCollection.deleteMany({serverId})

        return true;
    },
    cancelQueue: async (serverId) => {
        await backend.clearQueue(serverId);
        let serversCollection = db.collection('servers')
        let search = await serversCollection.findOne({serverId});
        if (search) {
            if (!search.stacking) {
                return false;
            }
        } else {
            await backend.saveServer(serverId);
        }
        await serversCollection.updateOne({serverId}, {$set: {stacking: false}});
        return true;
    },
    deferUser: (serverId, userId) => {

    },
    saveServer: async (id) => {
        let serversCollection = db.collection('servers');
        await serversCollection.insertOne({serverId: id, stacking: false})
        return true
    },
    help: async (commands) => {
        let commandsCollection = db.collection('commends');

    }
};
module.exports = backend;