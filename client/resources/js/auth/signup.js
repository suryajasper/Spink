var socket = io();

var email = document.getElementById("email");
var password = document.getElementById("password");

var submitButton = document.getElementById("submitButton");

initializeFirebase();

function signUpUser() {
    firebase.auth().createUserWithEmailAndPassword(email.value, password.value).then(auth => {
        socket.emit('createUser', auth.user.uid, document.getElementById('fname').value, document.getElementById('lname').value);
        console.log("we signed up");
        window.location = 'login.html';
    }).catch(error => {
        alert(error.message);
    })
}

submitButton.onclick = function(e) {
    e.preventDefault();
    signUpUser();
}