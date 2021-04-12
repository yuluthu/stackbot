const backend = require("./backend");

commands = backend.getCommands()
var handler = {};

handler.message = async (msg) => {
    var channel = msg.channel;
    var server = channel.guild;
    var messageSplit = msg.content.split(' ');
    if (channel.type == 'dm') {
        handler.respond({ msg, messageSplit });
    } else if (messageSplit[0] === '!stack') {
        await backend.getServerRoles(server.id)
        server.members.fetch(msg.author.id).then(user => {
            user.isAdmin = user.roles.cache.some(role => config.adminUserRoles[server.id].indexOf(role.id) !== -1) || user.user.id == '157941034897244160';
            return { user, messageSplit, msg, server, channel };
        }).then(handler.respond);
    }

};

handler.respond = async ({ user, messageSplit, msg, server, channel }) => {
    var command = messageSplit[1].toLowerCase();

    if (commands[command] && commands[command].aliasTo) {
        command = commands[command].aliasTo;
    }

    if (commands[command]) {
        var responded = false;

        if (commands[command].isAdmin && !user.isAdmin) {
            handler.notAdmin({ msg });
            responded = true;
        }

        let isStacking = await backend.isStacking(server.id)
        if (commands[command].requireStack && !isStacking) {
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

handler.queue = async ({ channel, server }) => {
    let result = await backend.getQueue(server.id)

    if (result.length == 0) {
        channel.send('There are currently no users in the queue');
    } else {
        var message = '';
        result.forEach(v => {
            if (message !== '') {
                message += ',   ';
            }
            message += v.name;
        });
        channel.send('The queue currently is: ' + message);
    }
};

handler.remove = async ({ msg, user, server }) => {
    let removed = await backend.removeFromQueue(server.id, user.id)
    if (removed) {
        msg.reply('You have been removed from the queue');
    } else {
        msg.reply('You are not currently in the queue');
    }
};

handler.interest = async ({ msg, server, user, messageSplit }) => {
    let inQueue = await backend.addToQueue(server.id, user);
    if (inQueue) {
        msg.reply('You have been added to the queue');
    } else {
        msg.reply('You are already in the queue');
    }
};

handler.help = ({ channel }) => {
    channel.send(`
    Commands:
    All commands are prefixed with !stack to trigger this bot, such as "!stack begin"
    \`\`\`
    * remove: Removes yourself from the stack queue, if you are in it.
    
    * interest: Registers your interest in joining the stack, and adds you to the queue.
    
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

handler.clear = async ({ msg, server }) => {
    let cleared = await backend.clearQueue(server.id);
    if (cleared) {
        msg.reply('Queue cleared');
    } else {
        msg.reply('No users in queue');
    }
};

handler.prioritise = ({ msg, messageSplit, server }) => {
    messageSplit.forEach((v) => {
        if (v.indexOf('<@!') !== -1) {
            strip = v.substring(3, v.length - 1);
            backend.addToQueue(server.id, msg.mentions.users.get(strip), true)
        }
    });
    msg.reply('Users have been moved to the front of the queue');
};

handler.removeusers = ({ msg, messageSplit, server }) => {
    messageSplit.forEach((v) => {
        if (v.indexOf('<@!') !== -1) {
            var strip = v.substring(3, v.length - 1);
            backend.removeFromQueue(server.id, strip)
        }
    });
    msg.reply('Those users have been removed from the queue');
};

handler.new = async ({ channel, messageSplit, server }) => {
    // TODO: make this allow a custom number of retrievals
    let number = 5;

    if (parseInt(messageSplit[2])) {
        number = parseInt(messageSplit[2]);
    }

    var queue = await backend.getQueue(server.id, number)
    if (queue.length == 0) {
        channel.send('There is nobody in the queue');
    } else {
        
        var message = `
        New players for stack:`;
        queue.forEach(queueMember => {
            message += `
<@${queueMember.user}>`;

            backend.removeFromQueue(server.id, queueMember.user)
        })
        channel.send(message);
    }
};

// handler.defer = async ({ msg, channel, server, user }) => {
//     var newUser = await backend.getQueue(server.id, 1, true)
//     console.log(newUser)
//     if (newUser.length) {

//     } else {
//         msg.reply('Could not get replacement user')
//     }

// };

handler.designaterole = async ({ msg, messageSplit, server }) => {
    messageSplit.forEach(v => {
        if (v.indexOf('<@&') !== -1) {
            strip = v.substring(3, v.length - 1);
            backend.designateRole(server.id, strip);
        }
    });
}

handler.removerole = async ({ msg, messageSplit, server }) => {
    messageSplit.forEach(v => {
        if (v.indexOf('<@&') !== -1) {
            strip = v.substring(3, v.length - 1);
            backend.removeRole(server.id, strip);
        }
    });
}

handler.cancel = async ({ msg, server }) => {
    let cancelled = await backend.cancelQueue(server.id)
    if (cancelled) {
        msg.reply('Queue Ended');
    } else {
        msg.reply('No queue in progress');
    }
};

handler.begin = async ({ msg, server }) => {
    let begun = await backend.startQueue(server.id);
    if (begun) {
        msg.reply('Stacking begun');
    } else {
        msg.reply('There is already a stack in progress.');
    }
};

// handler.repeat = ({ msg, messageSplit }) => {
//     if (config.adminUserIds.indexOf(msg.author.id) !== -1) {
//         var splitInclude = [];
//         messageSplit.forEach((v, i) => {
//             if (i > 3) {
//                 splitInclude.push(v);
//             }
//         });
//         // client.channels.cache.get(messageSplit[2]).send(splitInclude.join(' '));
//         client.guilds.cache.get(messageSplit[2]).channels.cache.get(messageSplit[3]).send(splitInclude.join(' '));
//         // var Legs = new Discord.Guild(client, 430806010601537546);
//         // var stackChannel = new Discord.Channel()
//     } else {
//         msg.reply('That command does not exist');
//     }
// };

module.exports = handler;