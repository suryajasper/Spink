var socket = io();
initializeFirebase();

var params = getURLObj();

function addAvailabilityDiv(day, total, times) {
    /*
    <div class="availabilityDayGroup">
        <p class="availabilityDay">Monday</p>
        <ul class="availabilityTimesList">
            <li class="availabilityTime">5:00 PM to 6:00 PM</li>
            <li class="availabilityTime">5:00 PM to 6:00 PM</li>
        </ul>
    </div>
    */
    var groupDiv = document.createElement('div');
    groupDiv.classList.add('availabilityDayGroup');

    var header = document.createElement('p');
    header.classList.add('availabilityDay');
    header.innerHTML = day + ' (' + total.hours + ' hours and ' + total.minutes + ' minutes)';
    groupDiv.appendChild(header);

    var list = document.createElement('ul');
    list.classList.add('availabilityTimesList');
    groupDiv.appendChild(list);

    for (var time of times) {
        var el = document.createElement('li');
        el.classList.add('availabilityTime');
        el.innerHTML = time.start + ' to ' + time.end;
        list.appendChild(el);
    }

    dom('availabilityDiv').appendChild(groupDiv);
}
firebase.auth().onAuthStateChanged(function(user) {
    socket.emit('getCourseInfo', params.id);
    socket.on('courseInfoRes', function(course) {
        console.log(course);

        if (user.uid == course.authorID) {
            dom('editButton').style.display = 'block';
            dom('editButton').onclick = function() {
                window.location.href = '/courses/view/?' + 'courseID=' + params.id;
            }
        }

        // name + description
        dom('courseName').innerHTML = course.name;
        dom('courseDescription').innerHTML = course.description.replaceAll('\n', '<br>');

        // availability
        if ('byDay' in course.availability) {
            var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            for (var day of days) {
                if (day in course.availability.byDay) {
                    var obj = course.availability.byDay[day];
                    addAvailabilityDiv(day, obj.totalTime, obj.times);
                }
            }
        } else if ('byGroup' in course.availability) {
            var ul = document.createElement('ul');
            for (var groupid = 0; groupid < course.availability.byGroup.length; groupid++)(function(groupid) {
                var group = course.availability.byGroup[groupid];
                var groupEl = document.createElement('li');
                groupEl.innerHTML = group.name;

                var sessionList = document.createElement('ul');
                for (var sessionid = 0; sessionid < group.sessions.length; sessionid++)(function(sessionid) {
                    var session = group.sessions[sessionid];
                    var sessionEl = document.createElement('li');

                    session.startTime = militaryToRegular(session.startTime);
                    session.endTime = militaryToRegular(session.endTime);

                    if ('settings' in session) {
                        if ('byWeek' in session.settings) {
                            var everyTwoWeeks = session.settings.byWeek == 2;
                            sessionEl.innerHTML = session.day + ' every ' + (everyTwoWeeks ? 'other' : session.settings.byWeek) + (everyTwoWeeks ? ' week ' : ' weeks ') +
                                ' from ' + session.startTime + ' to ' + session.endTime;
                        } else {
                            sessionEl.innerHTML = 'Every ' + session.day + ' from ' + session.startTime + ' to ' + session.endTime;
                        }

                        var maxStudents = course.classSize.maxSize;
                        var currStudents = 0;
                        if ('numStudentsPerSession' in session.settings) {
                            maxStudents = session.settings.numStudentsPerSession;
                        }
                        if ('registered' in session) {
                            currStudents = Object.values(session.registered).length;
                        }
                        sessionEl.innerHTML += ' (' + currStudents + '/' + maxStudents + ')';
                    } else {
                        sessionEl.innerHTML = 'Every ' + session.day + ' from ' + session.startTime + ' to ' + session.endTime;
                        if ('registered' in session) {
                            sessionEl.innerHTML += ' (' + session.registered.length + ')';
                        } else {
                            sessionEl.innerHTML += ' (0)';
                        }
                    }

                    // register verification code
                    if (user && user.uid !== course.authorID) {
                        var registerButton = document.createElement('button');
                        registerButton.innerHTML = 'Register';
                        registerButton.onclick = function() {
                            socket.emit('register', user.uid, params.id, groupid, sessionid);
                            socket.on('registrationSuccessful', function(redirect) {
                                window.location.href = redirect;
                            })
                        }
                        sessionEl.appendChild(registerButton);
                    }
                    sessionList.appendChild(sessionEl);
                })(sessionid)
                groupEl.appendChild(sessionList);

                ul.appendChild(groupEl);
            })(groupid)
            dom('availabilityDiv').appendChild(ul);
        }
    })
})