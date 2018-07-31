module.exports = (() => {
    'use strict';

    const config = require('./config.js');
    const client = require('twilio')(config.accountSid, config.authToken);

    function getDataSessions(simSid) {
        return new Promise((resolve, reject) => {
            client.wireless
                .sims(simSid)
                .dataSessions
                .list({
                    limit: 1
                })
                .then(sessions => {
                    resolve(sessions);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    function getCommands(simSid) {
        return new Promise((resolve, reject) => {
            client.wireless.commands
                .list({
                    sim: simSid,
                    direction: 'from_sim',
                    status: 'received'
                })
                .then(commands => resolve(commands))
                .catch(error => {
                    reject(error);
                });
        });
    }

    function getSims(simSid) {
        return new Promise((resolve, reject) => {
            if (simSid !== undefined) {
                client.wireless.sims(simSid)
                    .fetch()
                    .then(sim => resolve(sim))
                    .catch(error => {
                        reject(error);
                    })
                    .done();
            } else {
                // This is where I would pull all SIMs.
                resolve([{}]);
            }
        });
    }

    function sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (command == undefined || command == '') {
                reject({
                    message: 'Command body is empty.'
                });
            }

            client.wireless.commands.create({
                    command: command.sid,
                    sim: simSid
                })
                .then(() => {
                    resolve({
                        message: 'Command sent.'
                    });
                })
                .catch((error) => {
                    reject(error);
                })
        });
    }

    return {
        getSims,
        getCommands,
        sendCommand,
        getDataSessions
    };
})();