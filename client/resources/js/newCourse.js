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

    dom('createCourseButton').onclick = function() {
        var data = {
            name: dom('className').value,
            description: dom('classDescription').value,
            category: dom('topicIn').selectedValue,
            classSize: {
                ind: dom('sessionTypeInd').checked,
                group: dom('sessionTypeGroup').checked,
                maxSize: parseInt(dom('classSize').value)
            },
            availability: {
                byDay: dayToTimes,
                notes: dom('availabilityNotes').value
            }
        }
        console.log(data);
        socket.emit('createCourse', user.uid, data);
        window.location.href = '/courses/';
    }
})