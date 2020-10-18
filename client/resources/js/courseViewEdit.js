var socket = io();
initializeFirebase();

var currentDropdown;

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

dom('addLink').onclick = function() {
    dom('linkPopup').style.display = 'block';
    dom('postLinkButton').onclick = function() {
        var linkOptions = {
            title: dom('linkTitleInput').value,
            url: dom('urlInput').value
        };
        console.log(linkOptions);
        dom('linkPopup').style.display = 'none';
    }
    dom('cancelLinkPopupButton').onclick = function() {
        dom('linkPopup').style.display = 'none';
    }
}