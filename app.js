var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname + '/client'));
var port = process.env.PORT || 7000;

var admin = require("firebase-admin");
var serviceAccount = require("../secret/spink-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://spink-e5f86.firebaseio.com"
});

var database = admin.database();
var userInfo = database.ref('userInfo');

io.on('connection', function(socket) {
    socket.on('createUser', function(userID, _firstName, _lastName) {
        userInfo.child(userID).update({ firstName: _firstName, lastName: _lastName });
    });
})

http.listen(port, function() {
    console.log('listening on port ' + port.toString());
});