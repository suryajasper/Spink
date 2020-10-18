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
var courses = database.ref('courses');

io.on('connection', function(socket) {
    socket.on('createUser', function(userID, _firstName, _lastName) {
        userInfo.child(userID).update({ firstName: _firstName, lastName: _lastName });
    });
    socket.on('createCourse', function(userID, data) {
        data.authorID = userID;
        userInfo.child(userID).child('createdCourses').once('value', function(userCoursesSnap) {
            var ind = 0;
            if (userCoursesSnap && userCoursesSnap.val()) {
                ind = Object.keys(userCoursesSnap.val()).length;
            }
            userInfo.child(userID).child('createdCourses').child(ind).set(data);
        })
        courses.once('value', function(coursesSnap) {
            userInfo.child(userID).once('value', function(userSnap) {
                data.author = userSnap.val().firstName + ' ' + userSnap.val().lastName;
                var ind = 0;
                if (coursesSnap && coursesSnap.val()) {
                    ind = Object.keys(coursesSnap.val()).length;
                }
                courses.child(ind).set(data);
            })
        })
    })
    socket.on('getCourses', function() {
        courses.once('value', function(coursesSnap) {
            if (coursesSnap && coursesSnap.val()) {
                socket.emit('coursesRes', coursesSnap.val());
            }
        })
    })
    socket.on('getUserInfo', function(userID) {
        userInfo.child(userID).once('value', function(userSnap) {
            socket.emit('userInfoRes', userSnap.val());
        })
    })
    socket.on('getCourseInfo', function(id) {
        courses.child(id).once('value', function(snapshot) {
            if (snapshot && snapshot.val()) {
                socket.emit('courseInfoRes', snapshot.val());
            } else {
                socket.emit('courseInfoRes', null);
            }
        })
    })
    socket.on('register', function(userID, courseID, groupID, sessionID) {
        var groupRef = courses.child(courseID).child('availability').child('byGroup').child(groupID).child('sessions').child(sessionID);
        groupRef.once('value', function(groupSnap) {
            if (groupSnap && groupSnap.val()) {
                var val = groupSnap.val();
                var update = {};
                if ('registered' in val) {
                    if (Object.values(val.registered).includes(userID)) {
                        return;
                    }
                    update[Object.keys(val.registered).length] = userID;
                } else {
                    update[0] = userID;
                }
                groupRef.child('registered').update(update, function(error) {
                    if (!error) {
                        socket.emit('registrationSuccessful', '/');
                    }
                });
            }
        })
    })
    socket.on('addLinkToClass', function(userID, courseID, linkOptions) {
        var materialsRef = courses.child(courseID).child('content').child('materials');
        linkOptions.type = 'link';
        materialsRef.once('value', function(contentsnap) {
            var ind = 0;
            if (contentsnap && contentsnap.val()) {
                var content = contentsnap.val();
                ind = Object.values(content).length;
            }
            materialsRef.child(ind).set(linkOptions, function(error) {
                if (!error) {
                    socket.emit('refresh');
                }
            });
        })
    })
    socket.on('getClassMaterials', function(courseID) {
        var materialsRef = courses.child(courseID).child('content').child('materials');
        materialsRef.once('value', function(contentsnap) {
            if (contentsnap && contentsnap.val()) {
                socket.emit('classMaterialsRes', contentsnap.val());
            }
        })
    })
})

http.listen(port, function() {
    console.log('listening on port ' + port.toString());
});