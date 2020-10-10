var socket = io();

initializeFirebase();

var email = document.getElementById("email");
var password = document.getElementById("password");
var submitButton = document.getElementById("login");

function logInUser() {
    firebase.auth().signInWithEmailAndPassword(email.value, password.value).then(auth => {
        window.location = 'courses';
    }).catch(error => {
        alert(error.message);
    });
}

submitButton.onclick = function(e) {
    e.preventDefault();
    logInUser();
}