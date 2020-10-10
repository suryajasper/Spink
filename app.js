var admin = require("firebase-admin");
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
app.use(express.static(__dirname + '/client'));
var port = process.env.PORT || 9000;

var serviceAccount = require("/Users/suryajasper2004/Downloads/sfhs-gamedevclub-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sfhs-gamedevclub.firebaseio.com"
});

var database = admin.database();
var userInfo = database.ref('userInfo');
var games = database.ref('games');
var questions = database.ref('questions');
var updates = database.ref('updates');

io.on('connection', function(socket) {
    socket.on('createUser', function(email, userID, _firstName, _lastName) {
        var isAdmin = email === 'suryajasper@sfhs.com' || email === 'shlokshah@sfhs.com';
        userInfo.child(userID).update({ firstName: _firstName, lastName: _lastName, isAdmin: isAdmin });
    });
    socket.on('getUserName', function(userID) {
        userInfo.child(userID).once('value', function(snapshot) {
            socket.emit('userNameRes', snapshot.val());
        })
    });

    socket.on('publishGame', function(userID, name, gameObj) {
        userInfo.child(userID).once('value', function(snapshot) {
            var currGames = snapshot.val();
            if (currGames !== null && 'games' in currGames) {
                var update = {};
                update[Object.keys(currGames['games']).length] = name;
                userInfo.child(userID).child('games').update(update);
            } else {
                userInfo.child(userID).update({ 'games': { 0: name } });
            }
        })
        var gamesUpdate = {};
        gamesUpdate[name] = gameObj;
        games.update(gamesUpdate);
    });

    socket.on('changeColor', function(gameName, colorObj) {
        games.child(gameName).update(colorObj);
    })

    socket.on('getPublishedGames', function() {
        games.once('value', function(snapshot) {
            socket.emit('publishedGamesRes', snapshot.val());
        })
    })

    socket.on('getGameInfo', function(gameName) {
        games.child(gameName).once('value', function(snapshot) {
            socket.emit('gameInfoRes', snapshot.val());
        })
    })

    socket.on('askQuestion', function(userID, data) {
        data.askerID = userID;
        var date = (new Date()).getTime();
        questions.child('unanswered').child(data.topic).child(date).set(data);

        var userQuest = {};
        userQuest[date] = data.topic;
        userInfo.child(userID).child('questions').update(userQuest);
        socket.emit('refresh');
    })

    socket.on('getQuestions', function() {
        questions.once('value', function(snapshot) {
            socket.emit('questionsRes', snapshot.val());
        })
    })

    socket.on('getUserName', function(userID) {
        userInfo.child(userID).once('value', function(userSnap) {
            socket.emit('userNameRes', userSnap.val().firstName + " " + userSnap.val().lastName);
        })
    })

    socket.on('answerQuestion', function(userID, questionTime, answer) {
        userInfo.child(userID).once('value', function(userSnap) {
            var userInf = userSnap.val();
            var isAdmin = userInf.isAdmin;
            if (isAdmin === undefined) isAdmin = false;
            questions.once('value', function(questionSnap) {
                var quest = questionSnap.val();
                var questionInUnanswered = false;
                for (var topic of Object.keys(quest.unanswered)) {
                    if (questionTime in quest.unanswered[topic]) {
                        questionInUnanswered = true;
                        questions.child('unanswered').child(topic).child(questionTime).remove();
                        var update = quest.unanswered[topic][questionTime];
                        update.answers = [{ answer: answer, answerID: userID, byAdmin: isAdmin, answerName: userInf.firstName + ' ' + userInf.lastName }];
                        questions.child('answered').child(questionTime).set(update);
                        break;
                    }
                }
                if (!questionInUnanswered && questionTime in quest.answered) {
                    var numAnswers = Object.values(quest.answered[questionTime].answers).length;
                    var update = {};
                    update[numAnswers] = { answer: answer, answerID: userID, byAdmin: isAdmin, answerName: userInf.firstName + ' ' + userInf.lastName };
                    questions.child('answered').child(questionTime).child('answers').update(update);
                }
                socket.emit('refresh');
            })
        })
    })

    socket.on('addUpdate', function(userID, text) {
        userInfo.child(userID).once('value', function(snapshot) {
            var time = (new Date()).getTime();
            updates.child(time).set({
                content: text,
                sender: snapshot.val()
            });
        })
    })

    socket.on('getUpdates', function() {
        updates.once('value', function(snap) {
            socket.emit('updatesRes', snap.val());
        })
    })
})

http.listen(port, function() {
    console.log('listening on port ' + port.toString());
});