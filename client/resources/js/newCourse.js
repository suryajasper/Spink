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

var daySelect = dom('dayIn');
var selectedDays = [];

var dayToTimes = {};

dom('createCourseButton').disabled = true;

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

daySelect.onValueChange = function() {
    if (!selectedDays.includes(this.selectedValue)) {
        dayToTimes[this.selectedValue] = [];
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
            for (var div of timesDiv.children) {
                var startInp = div.getElementsByTagName('input')[0];
                var endInp = div.getElementsByTagName('input')[1];

                if (startInp.value === '' || endInp.value === '') {
                    break;
                }

                var timeForDiv = diff(startInp, endInp);
                total.hours += timeForDiv.hours;
                total.minutes += timeForDiv.minutes;
            }
            total.hours += parseInt(total.minutes / 60);
            total.minutes %= 60;
            timespan.innerHTML = ' ' + total.hours + " hours and " + total.minutes + ' minutes';
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