// Firebase Config – replace with your own config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Prompt for username on every page load
let username = prompt("Enter your name:");
while (!username) {
  username = prompt("Name cannot be empty. Enter your name:");
}

// References
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');

// Add online status for current user
const userStatusRef = db.ref('/status/' + username);
userStatusRef.onDisconnect().remove();
userStatusRef.set({ online: true });

// Show combined online/offline count
db.ref('/status').on('value', snap => {
  const statusObj = snap.val() || {};
  const onlineUsers = Object.keys(statusObj).filter(u => statusObj[u].online);
  statusEl.textContent = 'Online: ' + onlineUsers.join(', ');
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    const msgRef = db.ref('messages').push();
    msgRef.set({
      user: username,
      text: message,
      timestamp: Date.now()
    });
    messageInput.value = '';
  }
}

// Listen for messages
db.ref('messages').on('child_added', snap => {
  const msg = snap.val();
  displayMessage(msg.user, msg.text);
});

// Display messages
function displayMessage(user, text) {
  const div = document.createElement('div');
  div.classList.add('message');
  if (user === username) div.classList.add('my-message');
  div.textContent = `${user}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Clear Chat
clearBtn.addEventListener('click', () => {
  if (confirm("Clear all chat messages?")) {
    db.ref('messages').remove();
    chatBox.innerHTML = '';
  }
});
