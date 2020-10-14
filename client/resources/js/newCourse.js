var socket = io();
initializeFirebase();

function dom(id) {
    return document.getElementById(id);
}

var currInputIndex = 0;

function createInput(type, placeholder) {
    /*
    <div class="form__group field">
        <input type="input" class="form__field" placeholder="" required/>
        <label for="className" class="form__label">Class Name</label>
    </div>
    */
    var div = document.createElement('div');
    div.classList.add('form__group');
    div.classList.add('field');

    var input = document.createElement('input');
    input.type = type;
    input.classList.add('form__field');
    input.id = 'generated_input' + (currInputIndex++).toString();
    input.name = input.id;
    if (placeholder)
        input.placeholder = placeholder;
    div.appendChild(input);

    var label = document.createElement('label');
    label.setAttribute('for', input.id);
    label.classList.add("form__label");
    label.innerHTML = placeholder;
    div.appendChild(label);

    return { div: div, input: input };
}

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

//dom('createCourseButton').disabled = true;

function diff(start, end) {
    start = start.value; //to update time value in each input bar
    end = end.value; //to update time value in each input bar

    start = start.split(":");
    end = end.split(":");
    var startDate = new Date(0, 0, 0, start[0], start[1], 0);
    var endDate = new Date(0, 0, 0, end[0], end[1], 0);
    var diff = endDate.getTime() - startDate.getTime();
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var minutes = Math.floor(diff / 1000 / 60);

    // return (hours < 9 ? "0" : "") + hours + ":" + (minutes < 9 ? "0" : "") + minutes;
    return { hours: hours, minutes: minutes };
}

function militaryToRegular(time) {
    time = time.split(':');

    var hours = Number(time[0]);
    var minutes = Number(time[1]);

    var timeValue;

    if (hours > 0 && hours <= 12) {
        timeValue = "" + hours;
    } else if (hours > 12) {
        timeValue = "" + (hours - 12);
    } else if (hours == 0) {
        timeValue = "12";
    }

    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes; // get minutes
    timeValue += (hours >= 12) ? " P.M." : " A.M."; // get AM/PM

    return timeValue;
}

var daySelect = dom('dayIn');
var selectedDays = [];

var dayToTimes = {};
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        window.location.href = '/courses/'
    }
    daySelect.onValueChange = function() {
        if (!selectedDays.includes(this.selectedValue)) {
            var day = this.selectedValue;
            dayToTimes[day] = {};
            var dayDiv = document.createElement('div');
            dayDiv.classList.add('dayDiv');

            var p = document.createElement('p');
            p.innerHTML = this.selectedValue;
            p.classList.add('dayDivText');
            var timespan = document.createElement('span');
            timespan.innerHTML = ' 0 hours and 0 minutes';
            timespan.classList.add('timeDivTimeSpan');
            p.append(timespan);
            dayDiv.appendChild(p);

            var timesDiv = document.createElement('div');

            function refreshTotalTime() {
                var total = { hours: 0, minutes: 0 }
                var timeArr = [];
                for (var div of timesDiv.children) {
                    var startInp = div.getElementsByTagName('input')[0];
                    var endInp = div.getElementsByTagName('input')[1];

                    if (startInp.value === '' || endInp.value === '') {
                        break;
                    }

                    timeArr.push({
                        start: militaryToRegular(startInp.value),
                        end: militaryToRegular(endInp.value)
                    });

                    var timeForDiv = diff(startInp, endInp);
                    total.hours += timeForDiv.hours;
                    total.minutes += timeForDiv.minutes;
                }
                total.hours += parseInt(total.minutes / 60);
                total.minutes %= 60;
                timespan.innerHTML = ' ' + total.hours + " hours and " + total.minutes + ' minutes';

                dayToTimes[day] = {
                    totalTime: total,
                    times: timeArr
                }
            }


            var addTimeButton = document.createElement('button');
            addTimeButton.classList.add('dayDivButton');
            addTimeButton.innerHTML = 'Add Time';
            addTimeButton.onclick = function() {
                var timeDiv = document.createElement('div');
                timeDiv.classList.add('timeDiv');
                timeDiv.style.display = 'table';

                var inpStart = createInput('time', 'startTime *');
                inpStart.div.classList.add('timeDivInput');
                inpStart.div.classList.add('left');
                inpStart.input.oninput = refreshTotalTime;

                var sep = document.createElement('p');
                sep.innerHTML = 'to';
                sep.classList.add('timeDivSeparator');

                var inpEnd = createInput('time', 'endTime *');
                inpEnd.div.classList.add('timeDivInput');
                inpEnd.div.classList.add('right');
                inpEnd.input.oninput = refreshTotalTime;

                var deleteButtonWrapper = document.createElement('div');
                deleteButtonWrapper.classList.add('verticalAlignWrapper');
                var deleteButton = document.createElement('button');
                deleteButton.innerHTML = 'Remove';
                deleteButton.classList.add('deleteButton');
                deleteButton.onclick = function() {
                    timeDiv.remove();
                    refreshTotalTime();
                }
                deleteButtonWrapper.appendChild(deleteButton);

                timeDiv.appendChild(inpStart.div);
                timeDiv.appendChild(sep);
                timeDiv.appendChild(inpEnd.div);
                timeDiv.appendChild(deleteButtonWrapper);

                timesDiv.appendChild(timeDiv);
            }
            dayDiv.appendChild(addTimeButton);
            dayDiv.appendChild(timesDiv);
            dom('availabilityDiv').appendChild(dayDiv);

            selectedDays.push(this.selectedValue);
        }
    }
    var sortButtons = dom('sortPanel').children;
    for (var sortButton of sortButtons)(function(sortButton) {
        sortButton.onclick = function(e) {
            e.preventDefault();
            for (var sortButton_other of sortButtons)
                sortButton_other.classList.remove('buttonSelectSelected');
            sortButton.classList.add('buttonSelectSelected');
            if (sortButton.innerHTML === 'Day') {
                document.getElementById('byDayAvailability').style.display = 'block';
                document.getElementById('byClassGroupAvailability').style.display = 'none';
            } else if (sortButton.innerHTML === 'Class Group') {
                document.getElementById('byDayAvailability').style.display = 'none';
                document.getElementById('byClassGroupAvailability').style.display = 'block';
            }
        }
    })(sortButton)

    var numGroups = 1;

    dom('addGroupButton').onclick = function() {
        var groupDiv = document.createElement('div');
        groupDiv.classList.add('classGroupDiv');

        var groupDivHeader = createInput('text', 'Group name');
        groupDivHeader.div.classList.add('classGroupDivHeader');
        groupDivHeader.input.value = 'Group ' + numGroups++;
        groupDiv.appendChild(groupDivHeader.div);

        var buttonDiv = document.createElement('div');
        buttonDiv.classList.add('buttonDiv');

        var addClassSession = document.createElement('button');
        addClassSession.innerHTML = 'Add New Session';
        addClassSession.classList.add('bottomBorderButton');
        addClassSession.onclick = function() {
            var groupDivInputDiv = document.createElement('div');
            groupDivInputDiv.classList.add('groupDivInputDiv');

            var dayInput = createInput('text', 'Day');
            dayInput.div.classList.add('classGroupInput');
            groupDivInputDiv.appendChild(dayInput.div);

            var startTimeInput = createInput('time', 'Start Time');
            startTimeInput.div.classList.add('classGroupInput');
            groupDivInputDiv.appendChild(startTimeInput.div);

            var endTimeInput = createInput('time', 'End Time');
            endTimeInput.div.classList.add('classGroupInput');
            groupDivInputDiv.appendChild(endTimeInput.div);

            var settingsButton = document.createElement('img');
            settingsButton.classList.add('settingsButton');
            settingsButton.src = '../../resources/images/cog.svg';
            settingsButton.onclick = function() {
                dom('sessionSettingsPopup').style.display = 'block';
                if ('settings' in dayInput.input) {
                    if ('byWeek' in dayInput.input.settings)
                        dom('sessionAlternateByWeek').value = dayInput.input.settings.byWeek;

                    dom('sameAsCourseDefault').checked = dayInput.input.settings.sameAsCourseDefault;
                    dom('sameAsGroupDefault').checked = dayInput.input.settings.sameAsGroupDefault;
                    if ('numStudentsPerSession' in dayInput.input.settings)
                        dom('numStudentsPerSession').value = dayInput.input.settings.numStudentsPerSession;
                } else {
                    dom('sessionAlternateByWeek').value = '';
                    dom('sameAsCourseDefault').checked = true;
                    dom('sameAsGroupDefault').checked = false;
                    dom('numStudentsPerSession').value = dom('classSize').value;
                }
                dom('sessionSettingsSave').onclick = function() {
                    if (!('settings' in dayInput.input))
                        dayInput.input.settings = {};
                    if (dom('sessionAlternateByWeek').value !== '')
                        dayInput.input.settings.byWeek = dom('sessionAlternateByWeek').value;

                    dayInput.input.settings.sameAsCourseDefault = dom('sameAsCourseDefault').checked;
                    dayInput.input.settings.sameAsGroupDefault = dom('sameAsGroupDefault').checked;
                    if (dom('numStudentsPerSession').value !== '')
                        dayInput.input.settings.numStudentsPerSession = dom('numStudentsPerSession').value;
                    dom('sessionSettingsPopup').style.display = 'none';
                }
            }

            groupDivInputDiv.appendChild(settingsButton);

            groupDiv.appendChild(groupDivInputDiv);
        }

        var removeButton = document.createElement('button');
        removeButton.innerHTML = 'Remove';
        removeButton.classList.add('bottomBorderButton');
        removeButton.classList.add('removeButton');
        removeButton.onclick = function() {
            groupDiv.remove();
        }

        buttonDiv.appendChild(removeButton);
        buttonDiv.appendChild(addClassSession);

        groupDiv.appendChild(buttonDiv);

        dom('groupDiv').appendChild(groupDiv);
    }

    dom('createCourseButton').onclick = function() {
        var data = {
            name: dom('className').value,
            description: dom('classDescription').value,
            category: dom('topicIn').selectedValue,
            classSize: {
                ind: dom('sessionTypeInd').checked,
                group: dom('sessionTypeGroup').checked,
                maxSize: parseInt(dom('classSize').value)
            }
        }
        if (dom('byDayAvailability').style.display === 'block') {
            data.availability = {
                byDay: dayToTimes,
                notes: dom('availabilityNotes').value
            };
        } else {
            var groupToTimes = [];
            for (var groupDiv of dom('groupDiv').children) {
                var obj = {
                    name: groupDiv.getElementsByClassName('form__group')[0].getElementsByTagName('input')[0].value,
                    sessions: []
                };
                for (var timeDiv of groupDiv.getElementsByClassName('groupDivInputDiv')) {
                    var timeObj = {
                        day: timeDiv.children[0].getElementsByTagName('input')[0].value,
                        startTime: timeDiv.children[1].getElementsByTagName('input')[0].value,
                        endTime: timeDiv.children[2].getElementsByTagName('input')[0].value
                    };
                    if ('settings' in timeDiv.children[0].getElementsByTagName('input')[0])
                        timeObj.settings = timeDiv.children[0].getElementsByTagName('input')[0].settings;
                    obj.sessions.push(timeObj);
                }
                groupToTimes.push(obj);
            }
            data.availability = {
                byGroup: groupToTimes,
                notes: dom('availabilityNotes').value
            };
        }
        console.log(data);
        socket.emit('createCourse', user.uid, data);
        window.location.href = '/courses/';
    }
})