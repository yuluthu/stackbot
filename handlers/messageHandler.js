const config = require("../config");

var handler = {

};

commands = {
    clear: {
        isAdmin: true,
        requireStack: true,
    },
    cancel: {
        requireStack: true,
        isAdmin: true,
    },
    begin: {
        isAdmin: true,

    },
    interest: {
        requireStack: true,
    },
    join: {
        aliasTo: 'interest'
    },
    leave: {
        aliasTo: 'remove'
    },
    remove: {
        requireStack: true,
    },
    prioritise: {
        isAdmin: true,
        requireStack: true

    },
    new: {
        isAdmin: true,
        requireStack: true

    },
    removeusers: {
        isAdmin: true,
        requireStack: true
    },
    help: {

    },
    queue: {
        requireStack: true
    },
    testcommand: {
    },
    testing: {
    },
    repeat: {},
    defer: {
        requireStack: true
    }
};

handler.message = (msg) => {
    var channel = msg.channel;
    var server = channel.guild;
    var messageSplit = msg.content.split(' ');

    if (msg.channel.type == 'dm') {
        handler.respond({ msg, messageSplit });
    } else if (messageSplit[0] === '!stack') {
        if (!state[server.id]) {
            state[server.id] = {
                testing: false,
                queueing: false,
                users: {},
                queue: [],
                lastStack: [],
                log: []
            };
        }

        server.members.fetch(msg.author.id).then(user => {
            user.isAdmin = user.roles.cache.has(config.adminUserRole) || (config.adminUserIds.indexOf(user.id) !== -1 && state[server.id].testing);
            return { user, messageSplit, msg, server, channel };
        }).then(handler.respond);
    }

};

handler.respond = ({ user, messageSplit, msg, server, channel }) => {
    var command = messageSplit[1].toLowerCase();

    if (commands[command] && commands[command].aliasTo) {
        command = commands[command].aliasTo;
    }

    console.log(command, commands);

    if (commands[command]) {
        var responded = false;

        if (commands[command].isAdmin && !user.isAdmin) {
            handler.notAdmin({ msg });
            responded = true;
        }

        if (commands[command].requireStack && !state[server.id].queueing) {
            handler.noStack({ msg });
            responded = true;
        }
        if (!responded) {
            handler[command]({ msg, user, server, channel, messageSplit });
        }
    } else {
        msg.reply('That command does not exist');
    }
};

handler.queue = ({ channel, server }) => {
    if (state[server.id].queue.length == 0) {
        channel.send('There are currently no users in the queue');
    } else {
        var message = '';
        state[server.id].queue.forEach(v => {
            var thisUser = state[server.id].users[v];
            if (message !== '') {
                message += ', ';
            }
            message += thisUser.user.user.username;
        });
        channel.send('The queue currently is: ' + message);
    }
};

handler.remove = ({ msg, user, server }) => {
    var index = state[server.id].queue.indexOf(user.id);
    if (index !== -1) {
        state[server.id].queue.splice(index, 1);
        msg.reply('You have been removed from the queue');
    } else {
        msg.reply('You are not currently in the queue');
    }
};

handler.interest = ({ msg, server, user, messageSplit }) => {
    if (state[server.id].queue.indexOf(user.id) !== -1) {
        msg.reply('You are already in the queue');
    } else {
        handler.addUser({ user, messageSplit, server });
        msg.reply('You have been added to the queue');
    }
};

handler.help = ({ channel }) => {
    channel.send(`
    Commands:
    All commands are prefixed with !stack to trigger this bot, such as "!stack begin"
    \`\`\`
    * remove: Removes yourself from the stack queue, if you are in it.
    
    * interest: Registers your interest in joining the stack, and adds you to the end. If legs doesn't have you added, please include your battle tag. Additionally, you can include which roles you wish to play (tank/damage/support) (ex. !stack interest yuluthu#2484 support)
    
    * queue: Displays the current queue.
    
    * begin: Starts a new stack queue, if none is currently going.
    
    * clear: Clears the current stack queue.
    
    * cancel: Ends the current stack queue.
    
    * prioritise: Moves a tagged user (or users) to the front of the queue (ex. !stack prioritise @yuluthu)
    
    * new: Pulls the 5 people at the front of the queue, and removes them from the queue.
    
    * removeuser: Removes all tagged users from the queue (ex. !stack removeusers @yuluthu @legday)

    \`\`\``);
};

handler.noStack = ({ msg }) => {
    msg.reply('There is currently no stack in progress');
};

handler.notAdmin = ({ msg }) => {
    msg.reply('You don\'t have permission to execute that command');
};

handler.clear = ({ msg, server }) => {
    state[server.id] = Object.assign(state[server.id], {
        users: {},
        queue: []
    });
    msg.reply('Queue cleared');
};

handler.prioritise = ({ msg, messageSplit, server }) => {
    messageSplit.forEach((v) => {
        if (v.indexOf('<@!') !== -1) {
            strip = v.substring(3, v.length - 1);
            if (state[server.id].queue.indexOf(strip) == -1) {
                handler.addUser({ user: Object.assign({ user: msg.mentions.users.get(strip) }, msg.mentions.users.get(strip)), messageSplit: [], server });
            }
            state[server.id].queue.splice(state[server.id].queue.indexOf(strip), 1);
            state[server.id].queue.splice(0, 0, strip);
        }
    });
    msg.reply('Users have been moved to the front of the queue');
};

handler.removeusers = ({ msg, messageSplit, server }) => {
    messageSplit.forEach((v) => {
        if (v.indexOf('<@!') !== -1) {
            var strip = v.substring(3, v.length - 1);
            if (state[server.id].queue.indexOf(strip) !== -1) {
                state[server.id].queue.splice(state[server.id].queue.indexOf(strip), 1);
            }
        }
    });
    msg.reply('Those users have been removed from the queue');
};

handler.new = ({ channel, messageSplit, server }) => {
    // TODO: make this allow a custom number of retrievals
    if (state[server.id].queue.length == 0) {
        channel.send('There is nobody in the queue');
    } else {
        state[server.id].lastStack = [];
        var message = `
        New players for stack:`;
        for (i = 0; i <= 4; i++) {
            if (state[server.id].queue[0]) {
                var thisUser = state[server.id].users[state[server.id].queue[0]];
                message += `
<@${thisUser.user.id}>` + (thisUser.btag ? ', Battle Tag: ' + thisUser.btag : '') + (thisUser.roles.length ? ', Roles:' + thisUser.roles.join(', ') : '');
                state[server.id].queue.splice(0, 1);
                state[server.id].lastStack.push(thisUser.user.id);
            }
        }
        channel.send(message);
    }
};

handler.defer = ({ msg, channel, server, user }) => {
    var index = state[server.id].lastStack.indexOf(user.id);
    if (index !== -1) {
        if (state[server.id].queue.indexOf(user.id) !== -1) {
            msg.reply('You have already deferred your position in this stack');
        } else {
            var newUser = handler.getNewStackUser(0, server);
            if (newUser) {
                var message = `The new user is <@${newUser.user.id}>` + (newUser.btag ? ', Battle Tag: ' + newUser.btag : '') + (newUser.roles.length ? ', Roles:' + newUser.roles.join(', ') : '') + ', You have been moved back to the front of the queue';
                state[server.id].queue.splice(state[server.id].queue.indexOf(newUser.user.id), 1);
                state[server.id].lastStack.push(newUser.user.id);
                channel.send(message);
            } else {
                msg.reply('Could not find a user to replace you with');
            }
            state[server.id].queue.splice(0, 0, user.id);
        }
    } else {
        msg.reply('You are not in the current stack');
    }
};

handler.getNewStackUser = (index, server) => {
    var newUser = state[server.id].queue[index];

    if (newUser !== undefined && state[server.id].lastStack.indexOf(newUser) == -1) {
        return state[server.id].users[newUser];
    }
    if (newUser == undefined) {
        return false;
    }

    return handler.getNewStackUser(index + 1, server);
};

handler.cancel = ({ msg, server }) => {
    state[server.id] = Object.assign(state[server.id], {
        users: {},
        lastStack: [],
        queueing: false,
        queue: []
    });
    msg.reply('Queue Ended');
};

handler.begin = ({ msg, server }) => {
    if (state[server.id].queueing) {
        msg.reply('There is already a stack in progress.');
    } else {
        state[server.id].queueing = true;
        msg.reply('Stacking begun');
    }
};

handler.addUser = ({ user, messageSplit, server }) => {
    var btag = '';
    var roles = [];

    messageSplit.forEach(v => {
        if (v && v.indexOf('#') !== -1) {
            btag = v;
        }
        switch (v.toLowerCase()) {
            case 'dps':
            case 'int':
                v = 'damage';
            case 'support':
            case 'healer':
            case 'tank':
            case 'damage':
            case 'flex':
                roles.push(v.charAt(0).toUpperCase() + v.slice(1));
        }
    });

    state[server.id].queue.push(user.id);
    state[server.id].users[user.id] = { user, btag, roles };
};

handler.testing = ({ user, server, msg }) => {
    if (config.adminUserIds.indexOf(user.id) !== -1) {
        state[server.id].testing = !state[server.id].testing;
    } else {
        msg.reply('Nope');
    }
};

handler.testcommand = ({ user, server, msg }) => {
    var result = db.query('SELECT * FROM admin-roles', (err, result) => {
        if (err) {
            return err;
        }
        return result ? result : '';
    });

    msg.reply(result);
};

handler.repeat = ({ msg, messageSplit }) => {
    if (config.adminUserIds.indexOf(msg.author.id) !== -1) {
        var splitInclude = [];
        messageSplit.forEach((v, i) => {
            if (i > 3) {
                splitInclude.push(v);
            }
        });
        // client.channels.cache.get(messageSplit[2]).send(splitInclude.join(' '));
        client.guilds.cache.get(messageSplit[2]).channels.cache.get(messageSplit[3]).send(splitInclude.join(' '));
        // var Legs = new Discord.Guild(client, 430806010601537546);
        // var stackChannel = new Discord.Channel()
    } else {
        msg.reply('That command does not exist');
    }
};

module.exports = handler;