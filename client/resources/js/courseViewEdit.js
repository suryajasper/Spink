var socket = io();
initializeFirebase();

var currentDropdown;
var params = getURLObj();

for (var dropdownGroup of document.getElementsByClassName("dropdownGroup"))(function(dropdownGroup) {
    var div = dropdownGroup.getElementsByClassName('dropdownContent')[0];
    div.style.display = 'none';
    dropdownGroup.getElementsByTagName('button')[0].onclick = function(e) {
        e.stopPropagation();
        currentDropdown = div;
        div.style.display = 'block';
    }
})(dropdownGroup)

document.onclick = function() {
    if (currentDropdown) {
        currentDropdown.style.display = 'none';
    }
}

firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        window.location.href = '/courses/';
    }
    socket.on('refresh', function() {
        socket.emit('getClassMaterials', params.courseid);
    })
    dom('addLink').onclick = function() {
        dom('linkPopup').style.display = 'block';
        dom('postLinkButton').onclick = function() {
            var linkOptions = {
                title: dom('linkTitleInput').value,
                url: dom('urlInput').value
            };
            console.log(linkOptions);
            socket.emit('addLinkToClass', user.uid, params.courseid, linkOptions);
            dom('linkPopup').style.display = 'none';
        }
        dom('cancelLinkPopupButton').onclick = function() {
            dom('linkPopup').style.display = 'none';
        }
    }
    socket.emit('getClassMaterials', params.courseid);
    socket.on('classMaterialsRes', function(materials) {
        $('#classMaterials').empty();
        for (var material of materials) {
            /*<div class="classMaterialDiv">
                <img class="classMaterialImg" src="https://s2.googleusercontent.com/s2/favicons?domain=www.stackoverflow.com" />
                <a class="classMaterialText" href="https://stackoverflow.com/questions/10282939/how-to-get-favicons-url-from-a-generic-webpage-in-javascript">Stack Overflow</a>
            </div>*/
            var materialDiv = document.createElement('div');
            materialDiv.classList.add('classMaterialDiv');

            var img = document.createElement('img');
            img.classList.add('classMaterialImg');
            if (material.type === 'link')
                img.src = 'https://s2.googleusercontent.com/s2/favicons?domain_url=' + material.url;
            materialDiv.appendChild(img);

            var a = document.createElement('a');
            a.classList.add('classMaterialText');
            a.innerHTML = material.title;
            a.href = material.url;
            materialDiv.appendChild(a);

            dom('classMaterials').appendChild(materialDiv);
        }
    });
})