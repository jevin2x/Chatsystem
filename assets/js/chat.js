// Firebase config
var firebaseConfig = {
    apiKey: "AIzaSyAf1rx_kVNQ7kfnhm5yn3mlsf3jHFP7xF0",
    authDomain: "chatsystem-001.firebaseapp.com",
    databaseURL: "https://chatsystem-001-default-rtdb.firebaseio.com",
    projectId: "chatsystem-001",
    storageBucket: "chatsystem-001.firebasestorage.app",
    messagingSenderId: "20781486614",
    appId: "1:20781486614:web:6db9555f47ea2223c45b37"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// Check login
let username = localStorage.getItem('chat_name');
if (!username) window.location.replace("./assets/pages/Signin.html");

// Elements
const chatBox = document.getElementById('chat');
const msgInput = document.getElementById('msg');
const userPic = document.getElementById('userPic');
const uploadPic = document.getElementById('uploadPic');
const friendsUl = document.getElementById('friendsUl');
const requestsUl = document.getElementById('requestsUl');
const sendBtn = document.getElementById('send');
const addBtn = document.getElementById('addBtn');
const newUserInput = document.getElementById('newUser');
document.getElementById('userName').textContent = username;

// Disable chat if not logged in
function disableChat() {
    msgInput.disabled = true;
    sendBtn.disabled = true;
    addBtn.disabled = true;
    newUserInput.disabled = true;
}
if(!username) disableChat();

// Profile pic upload
userPic.addEventListener('click', () => uploadPic.click());
uploadPic.addEventListener('change', function() {
    const file = this.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e){
        userPic.src = e.target.result;
        localStorage.setItem('userPic_' + username, e.target.result);
    }
    reader.readAsDataURL(file);
});
const savedPic = localStorage.getItem('userPic_' + username);
userPic.src = savedPic ? savedPic : "./assets/images/default.jpg";

// --- Friend system ---
// Send friend request
addBtn.onclick = function(){
    if(!username) return;
    const friendName = newUserInput.value.trim();
    if(!friendName) return;
    if(friendName === username){ alert("Cannot add yourself!"); newUserInput.value=""; return;}
    db.ref(`friends/${username}/${friendName}`).get().then(snap=>{
        if(snap.exists()){ alert(friendName+" is already your friend!"); newUserInput.value=""; return;}
        db.ref(`friendRequests/${friendName}`).push({
            from: username,
            pic: localStorage.getItem('userPic_' + username) || "./assets/images/default.jpg"
        });
        newUserInput.value="";
        alert(`Friend request sent to ${friendName}`);
    });
}

// Listen for friend requests
db.ref(`friendRequests/${username}`).on('child_added', snapshot=>{
    const data = snapshot.val();
    const li = document.createElement('li');
    li.innerHTML = `<img src="${data.pic}" alt="${data.from}" style="width:40px;height:40px;border-radius:50%;margin-right:10px;"><span>${data.from}</span>`;
    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = "Accept";
    acceptBtn.onclick = () => {
        addFriend(username, data.from, data.pic);
        const myPic = localStorage.getItem('userPic_' + username) || "./assets/images/default.jpg";
        addFriend(data.from, username, myPic);
        snapshot.ref.remove();
        requestsUl.removeChild(li);
    };
    li.appendChild(acceptBtn);
    requestsUl.appendChild(li);
});

function addFriend(user, friendName, friendPic){
    db.ref(`friends/${user}/${friendName}`).set({
        name: friendName,
        pic: friendPic
    });
}

// Display friends list
db.ref(`friends/${username}`).on('value', snapshot=>{
    friendsUl.innerHTML = "";
    snapshot.forEach(child=>{
        const data = child.val();
        const li = document.createElement('li');
        li.innerHTML = `<img src="${data.pic}" alt="${data.name}" style="width:40px;height:40px;border-radius:50%;margin-right:10px;"><span>${data.name}</span>`;
        friendsUl.appendChild(li);
    });
});

// --- Chat system ---
sendBtn.onclick = function(){
    if(!username) return;
    let text = msgInput.value.trim();
    if(text==="") return;
    db.ref("messages").push({
        sender: username,
        text: text,
        timestamp: Date.now()
    });
    msgInput.value="";
}

// Display chat
// Display chat
db.ref("messages").on("child_added", snapshot => {
    const data = snapshot.val();
    const div = document.createElement('div');
    div.textContent = data.sender + ": " + data.text;
    div.className = (data.sender === username) ? 'right' : 'left';
    div.dataset.key = snapshot.key; // store key for updates

    // Add edit/remove for own messages
    if(data.sender === username){
        // Desktop right-click
        div.addEventListener('contextmenu', (e)=>{
            e.preventDefault();
            showEditRemoveMenu(e.pageX, e.pageY, snapshot.ref, data.text);
        });
        // Mobile long press
        let timer;
        div.addEventListener('touchstart', e=>{
            timer = setTimeout(()=>{
                showEditRemoveMenu(e.touches[0].pageX, e.touches[0].pageY, snapshot.ref, data.text);
            }, 600);
        });
        div.addEventListener('touchend', e=> clearTimeout(timer));
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Listen for edits
db.ref("messages").on("child_changed", snapshot => {
    const data = snapshot.val();
    const divs = chatBox.querySelectorAll('div');
    divs.forEach(div => {
        if(div.dataset.key === snapshot.key){
            div.textContent = data.sender + ": " + data.text;
        }
    });
});

// Listen for deletes
db.ref("messages").on("child_removed", snapshot => {
    const divs = chatBox.querySelectorAll('div');
    divs.forEach(div => {
        if(div.dataset.key === snapshot.key){
            div.remove();
        }
    });
});


// Show menu function
function showEditRemoveMenu(x, y, ref, currentText){
    // remove existing menu
    const existing = document.getElementById('msgMenu');
    if(existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'msgMenu';
    menu.style.position = 'absolute';
    menu.style.top = y+'px';
    menu.style.left = x+'px';
    menu.style.background = '#333';
    menu.style.color = '#fff';
    menu.style.padding = '5px';
    menu.style.borderRadius = '5px';
    menu.style.zIndex = 1000;
    menu.innerHTML = `<button style="margin-right:5px;">Edit</button><button>Remove</button>`;
    document.body.appendChild(menu);

    const removeMenu = () => { if(menu.parentNode) menu.remove(); document.removeEventListener('click', removeMenu);};
    setTimeout(()=> document.addEventListener('click', removeMenu), 0);

    menu.querySelector('button:first-child').onclick = ()=>{
        const newText = prompt("Edit your message:", currentText);
        if(newText!==null && newText.trim()!=="") ref.update({text:newText});
        removeMenu();
    };
    menu.querySelector('button:last-child').onclick = ()=>{
        if(confirm("Delete this message?")) ref.remove();
        removeMenu();
    };
}

// --- Logout ---
document.getElementById('logoutBtn').addEventListener('click', ()=>{
    localStorage.removeItem('chat_name');
    window.location.replace("./assets/pages/Signin.html");
});
