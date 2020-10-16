var socket = io();

var lastResize = 0;

var detached = [];

function removeAll() {
    if (dom('courseDiv').children[0].classList.contains('flex-container')) {
        console.log('hoorah');
        for (var flexBox of dom('courseDiv').children) {
            var childCount = flexBox.childElementCount;
            if (flexBox.classList.contains('course-block')) {
                detached.push($(flexBox).detach());
            } else {
                for (var child = 0; child < childCount; child++) {
                    detached.push($(flexBox.children[0]).detach());
                }
            }
        }
        var childCount = dom('courseDiv').childElementCount;
        for (var i = 0; i < childCount; i++) {
            dom('courseDiv').children[0].remove();
        }
    } else {
        var childCount = dom('courseDiv').childElementCount;
        for (var child = 0; child < childCount; child++) {
            detached.push($(dom('courseDiv').children[0]).detach());
        }
    }
}

function refreshRows() {
    if (dom('courseDiv').childElementCount === 0) return;
    var maxEl = Math.floor(window.innerWidth / 350);
    if (maxEl !== lastResize) {
        // when it's the number of nodes -1
        lastResize = maxEl;
        removeAll();
        console.log('length ' + detached.length);
        console.log('maxEl ' + maxEl + ' ');
        var currDiv = document.createElement('div');
        currDiv.classList.add('flex-container');
        var i = 0;
        while (detached.length > 0) {
            console.log(detached.length + ' ' + i);
            var popped = detached.pop();
            console.log(popped);
            if (i++ >= maxEl) {
                i = 0;
                dom('courseDiv').appendChild(currDiv);
                currDiv = document.createElement('div');
                currDiv.classList.add('flex-container');
            }
            popped.appendTo(currDiv);
        }
        dom('courseDiv').appendChild(currDiv);
    }
}

function addElWithClass(tag, innerHTML, className) {
    var el = document.createElement(tag);
    if (innerHTML)
        el.innerHTML = innerHTML;
    if (className)
        el.classList.add(className);
    return el;
}

function addBlock(data) {
    /*
    <div class="course-block">
        <p class="course-block-title">Intro to CS</p>
        <p class="course-block-category">Computer Science</p>
        <br/><br/>
        <p class="course-block-author">Taught by Surya Jasper</p>
        <p class="course-block-description">This is a course about programming.<br>So get your thinking caps ready!</p>
        <p class="course-block-dates">Sundays, Mondays, and Tuesdays</p>
        <button class="course-block-button">View</button>
    </div>
    */
    var div = document.createElement('div');
    div.classList.add('course-block');

    div.appendChild(addElWithClass('p', data.name, "course-block-title"));
    div.appendChild(addElWithClass('p', data.category, "course-block-category"));
    div.appendChild(addElWithClass('br'));
    div.appendChild(addElWithClass('br'));
    div.appendChild(addElWithClass('p', data.author, "course-block-author"));
    div.appendChild(addElWithClass('p', data.description, "course-block-description"));
    div.appendChild(addElWithClass('p', data.dates, "course-block-dates"));

    var button = addElWithClass('button', 'View', 'course-block-button');
    button.onclick = function() { window.location.href = '/courses/register/?id=' + data.courseId + '&name=' + data.name.toLowerCase() + '&viewType=preview'; }
    div.appendChild(button);

    dom('courseDiv').appendChild(div);
    refreshRows();
}

socket.emit('getCourses');
socket.on('coursesRes', function(res) {
    for (var id of Object.keys(res)) {
        var course = res[id];
        addBlock({
            name: course.name,
            category: course.category,
            author: 'Taught by ' + course.author,
            description: course.description,
            dates: 'bruh',
            courseId: id
        });
    }
})

window.addEventListener('resize', refreshRows);