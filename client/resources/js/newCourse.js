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

daySelect.onValueChange = function() {
    if (!selectedDays.includes(this.selectedValue)) {
        dayToTimes[this.selectedValue] = [];
        var dayDiv = document.createElement('div');
        dayDiv.classList.add('dayDiv');

        var p = document.createElement('p');
        p.innerHTML = this.selectedValue;
        p.classList.add('dayDivText');
        dayDiv.appendChild(p);

        var addTimeButton = document.createElement('button');
        addTimeButton.classList.add('dayDivButton');
        addTimeButton.innerHTML = 'Add Time';
        addTimeButton.onclick = function() {
            var timeDiv = document.createElement('div');
            timeDiv.classList.add('timeDiv');

            var inpStart = createInput('time', 'startTime');
            inpStart.div.classList.add('timeDivInput');
            inpStart.div.classList.add('left');

            var sep = document.createElement('p');
            sep.innerHTML = 'to';
            sep.classList.add('timeDivSeparator');

            var inpEnd = createInput('time', 'endTime');
            inpEnd.div.classList.add('timeDivInput');
            inpEnd.div.classList.add('right');

            timeDiv.appendChild(inpStart.div);
            timeDiv.appendChild(sep);
            timeDiv.appendChild(inpEnd.div);

            insertAfter(timeDiv, dayDiv);
        }
        dayDiv.appendChild(addTimeButton);
        dom('availabilityDiv').appendChild(dayDiv);

        selectedDays.push(this.selectedValue);
    }
}