var socket = io();
initializeFirebase();

var params = getURLObj();

var registerButton = dom('registerButton');
registerButton.disabled = true;

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

socket.emit('getCourseInfo', params.id);
socket.on('courseInfoRes', function(course) {
    console.log(course);
    // name
    dom('courseName').innerHTML = course.name;

    // description
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
        for (var group of course.availability.byGroup) {
            var groupEl = document.createElement('li');
            groupEl.innerHTML = group.name;

            var sessionList = document.createElement('ul');
            for (var session of group.sessions) {
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
                } else {
                    sessionEl.innerHTML = 'Every ' + session.day + ' from ' + session.startTime + ' to ' + session.endTime;
                }
                sessionList.appendChild(sessionEl);
            }
            groupEl.appendChild(sessionList);

            ul.appendChild(groupEl);
        }
        dom('availabilityDiv').appendChild(ul);
    }
})

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        registerButton.disabled = false;
    } else {
        registerButton.setAttribute('title', 'Log in or create an account to join');
    }
})