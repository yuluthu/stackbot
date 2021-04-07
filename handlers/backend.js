const db = require("../classes/database");

var backend = {
    getCommands: async () => {
        return new Promise(resolve => {
            var commands = {}
            db.read('commands', ['*']).then(result => {
                result.forEach((row) => {
                    commands[row.name] = backend.getOptions(row.id, commands[row.name])
                })

                resolve(commands)
            });
        });
    },
    getOptions: (id) => {
        var options = {}
        db.read('commands_properties', ['*'], {commandID: id}).then(result => {
            result.forEach(row => {
                if (row.property == 'aliasTo') {
                    options[row.property] = backend.getCommandName(row.value, options[row.property])
                } else {
                    options[row.property] = row.value
                }
            });
        })
        return options;
    },
    getCommandName: (id) => {
        let name = false;
        db.read('commands', ['*'], {id: id}).then(result => {
            result.forEach(result => {
                name = result.name
                target = name;
            });
        });
        return name
    }
};


module.exports = backend;