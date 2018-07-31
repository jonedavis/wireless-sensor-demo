'use strict';

const express = require('express');
const app = express();
const path = require('path');
const wireless = require('./api/twilio.wireless.js');

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', (process.env.PORT || 5000));
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

// Render index.ejs
app.get('/', (req, res) => {
    res.render('index', {});
});

app.get('/Commands/:sid', (req, res) => {
    if (req.params.sid === undefined || req.params.sid === '') {
        res.status(500).send('Sim sid is undefined. Check credentials.');
    }
    wireless
        .getCommands(req.params.sid)
        .then(commands => res.send(commands))
        .catch(() => res.status(500).send('Error retrieving Commands. Check credentials.'));
});

app.get('/DataSessions/:sid', (req, res) => {
    if (req.params.sid === undefined || req.params.sid === '') {
        res.status(500).send('Sim sid is undefined.');
    }
    wireless
        .getDataSessions(req.params.sid)
        .then(sessions => res.send(sessions))
        .catch(() => res.status(500).send('Error retrieving DataSessions. Check credentials.'));
});

app.get('/Sims/:sid', (req, res) => {
    if (req.params.sid === undefined || req.params.sid === '') {
        res.status(500).send('Sim sid is undefined.');
    }
    wireless.getSims(req.params.sid)
        .then(sims => res.send(sims))
        .catch(() => res.status(500).send('Error retrieving Sims. Check credentials.'));
});

// Kick off server on port
app.listen(app.get('port'), () => {
    console.log(`Listening on port ${app.get('port')}`);
});