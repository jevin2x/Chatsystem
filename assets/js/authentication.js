// ======= FIREBASE CONFIG =======
var firebaseConfig = {
  apiKey: "AIzaSyAf1rx_kVNQ7kfnhm5yn3mlsf3jHFP7xF0",
  authDomain: "chatsystem-001.firebaseapp.com",
  databaseURL: "https://chatsystem-001-default-rtdb.firebaseio.com",
  projectId: "chatsystem-001",
  storageBucket: "chatsystem-001.firebasestorage.app",
  messagingSenderId: "20781486614",
  appId: "1:20781486614:web:6db9555f47ea2223c45b37"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// ======= SIGNUP =======
if(document.getElementById('signupBtn')){
  document.getElementById('signupBtn').onclick = function(){
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();

    if(!username || !password){
      alert("Please fill all fields");
      return;
    }

    // Check if username exists
    db.ref('users/' + username).get().then(function(snapshot){
      if(snapshot.exists()){
        alert("Username already exists!");
      } else {
        db.ref('users/' + username).set({ password: password }, function(error){
          if(error){
            alert("Error saving data: " + error);
          } else {
            alert("Account created successfully!");
            window.location.href = "signin.html";
          }
        });
      }
    }).catch(function(error){
      console.error(error);
      alert("Error checking username: " + error);
    });
  }
}

// ======= LOGIN =======
if(document.getElementById('signinBtn')){
  document.getElementById('signinBtn').onclick = function(){
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();

    if(!username || !password){
      alert("Please fill all fields");
      return;
    }

    db.ref('users/' + username).get().then(function(snapshot){
      if(snapshot.exists()){
        var userData = snapshot.val();
        if(userData.password === password){
          localStorage.setItem('chat_name', username);
          alert("Login successful!");
          window.location.href = "../../index.html";
        } else {
          alert("Incorrect password!");
        }
      } else {
        alert("Username does not exist!");
      }
    }).catch(function(error){
      console.error(error);
      alert("Error logging in: " + error);
    });
  }
}
