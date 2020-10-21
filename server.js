// Server Settings
const express = require('express');
const server = express();
const port = 8080;

// Server Database
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'USUARIO',
    password: 'SUASENHA',
    database: 'project_ibm_watson_db'
});
connection.connect();

// Server Audio Directory Public
server.use('/audio', express.static(__dirname + '/audio'));

// Server FyleSystem
const fs = require('fs');

// Server Post Json/Encoded
const bodyParser = require('body-parser');
server.use(bodyParser.json());
server.use(bodyParser.urlencoded());

// Server Get Index
server.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Server List Comments
server.post('/comments', (req, res) => {
    connection.query('SELECT * FROM comments', (err, result) => {
        let response = {
            'length': result.length,
            'data': result
        };
    
        res.contentType('json');
        res.send(result);
    });
});

// Server Save a Comment
server.post('/save-comment', (req, res) => {
    connection.query('INSERT INTO comments (id, comment) VALUES (default, "'+ req.body.text +'")', (err, result) => {
        res.contentType('json');
        if(result.affectedRows > 0){
            res.send({'status': true});
        }
        else {
            res.send({'status': false});
        }
        
    });
});

// Server Text to Speech
server.post('/text-to-audio', (req, res) => {
    const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
    const { IamAuthenticator } = require('ibm-watson/auth');

    const textToSpeech = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
            apikey: 'EG9No0tmmoih-ISe-xfQwuVlfC0Bxvts80KqEoF1fwyR',
        }),
        serviceUrl: 'https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/1f3e5879-2a02-4f95-b7b3-e1e612cc75f6',
        headers: {
            'X-Watson-Learning-Opt-Out': 'true'
        }
    });

    const synthesizeParams = {
        text: req.body.text,
        accept: 'audio/wav',
        voice: 'pt-BR_IsabelaV3Voice'
    };

    textToSpeech.synthesize(synthesizeParams)
    .then(response => {
        return textToSpeech.repairWavHeaderStream(response.result);
    })
    .then(buffer => {
        fs.writeFileSync('audio/audio.wav', buffer);
        res.contentType('json');
        res.send({'audio': 'audio/audio.wav'});
    });
});

// Server Listener 8080
server.listen(port, () => {
    console.log(`This server is running at http://localhost:${port}`);
});