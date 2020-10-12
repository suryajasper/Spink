function dom(id) {
    return document.getElementById(id);
}

var lastResize = 0;

var detached = [];

function removeAll() {
    if (dom('courseDiv').children[0].classList.contains('flex-container')) {
        console.log('hoorah');
        for (var flexBox of dom('courseDiv').children) {
            var childCount = flexBox.childElementCount;
            for (var child = 0; child < childCount; child++) {
                detached.push($(flexBox.children[0]).detach());
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
    var maxEl = Math.round(window.innerWidth / 350);
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
            var popped = detached.pop(0);
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

window.addEventListener('resize', refreshRows);