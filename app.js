// Prompt for name every time page loads
let username = prompt("Select user: Ishu or Billi");
if (!username) username = 'Ishu';
username = username.toLowerCase() === 'billi' ? 'Billi' : 'Ishu';
document.getElementById('chatUser').innerText = 'Chat - ' + username;

const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const statusSpan = document.getElementById('status');
const typingStatusDiv = document.getElementById('typingStatus');
const clearBtn = document.getElementById('clearBtn');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAyLfQR-k8L45imDdx0N-5pw8P43_pmJ8E",
  authDomain: "youandme12345-d1d17.firebaseapp.com",
  databaseURL: "https://youandme12345-d1d17-default-rtdb.firebaseio.com",
  projectId: "youandme12345-d1d17",
  storageBucket: "youandme12345-d1d17.firebasestorage.app",
  messagingSenderId: "500541583420",
  appId: "1:500541583420:web:ec35f7355884fb6e345339"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const chatRef = db.ref('chat');
const typingRef = db.ref('typing');
const statusRef = db.ref('status/' + username);

// Set online status
statusRef.set({online: true, lastActive: Date.now()});
statusRef.onDisconnect().set({online: false, lastActive: Date.now()});

// Listen for other user status
db.ref('status').on('value', snap => {
  let statusText = '';
  snap.forEach(child => {
    const key = child.key;
    const val = child.val();
    if (key === username) {
      statusText += `${key} (You) - ${val.online ? 'online' : 'offline'} | `;
    } else {
      statusText += `${key} - ${val.online ? 'online' : 'offline'} | `;
    }
  });
  statusSpan.innerText = statusText.slice(0, -3); // remove last " | "
});

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const msgObj = {
    user: username,
    text: text,
    time: Date.now()
  };

  chatRef.push(msgObj);
  messageInput.value = '';
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
  typingRef.set(username);
  setTimeout(() => typingRef.remove(), 1000);
});

// Show typing status
typingRef.on('value', snap => {
  const val = snap.val();
  if (val && val !== username) {
    typingStatusDiv.innerText = val + ' is typing...';
  } else {
    typingStatusDiv.innerText = '';
  }
});

// Read messages + display
chatRef.on('value', snap => {
  messagesDiv.innerHTML = '';
  snap.forEach(child => {
    const msg = child.val();
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.user === username ? 'me' : 'other');
    div.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Clear chat
clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the chat?')) {
    chatRef.remove();
  }
});
