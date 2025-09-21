// Prompt for name every time page loads
const username = prompt("Select user: Ishu or Billi");
document.getElementById('chatUser').innerText = 'Chat - ' + username;

const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const statusSpan = document.getElementById('status');
const typingStatusDiv = document.getElementById('typingStatus');
const clearBtn = document.getElementById('clearBtn');

// 🔹 Firebase config embedded directly
const firebaseConfig = {
  apiKey: "AIzaSyAyLfQR-k8L45imDdx0N-5pw8P43_pmJ8E",
  authDomain: "youandme12345-d1d17.firebaseapp.com",
  databaseURL: "https://youandme12345-d1d17-default-rtdb.firebaseio.com",
  projectId: "youandme12345-d1d17",
  storageBucket: "youandme12345-d1d17.firebasestorage.app",
  messagingSenderId: "500541583420",
  appId: "1:500541583420:web:ec35f7355884fb6e345339"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const chatRef = db.ref('chat');
const typingRef = db.ref('typing');
const statusRef = db.ref('status/' + username);

// set online status
statusRef.set({online: true, lastActive: Date.now()});
statusRef.onDisconnect().set({online: false, lastActive: Date.now()});

// listen for other user status
db.ref('status').on('value', snap => {
  let txt = '';
  snap.forEach(child => {
    if (child.key !== username) {
      const val = child.val();
      if (val.online) txt = child.key + ' is online';
      else txt = child.key + ' last active ' + new Date(val.lastActive).toLocaleTimeString();
    }
  });
  statusSpan.innerText = txt;
});

// send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
  typingRef.set(username);
  setTimeout(() => typingRef.remove(), 1500);
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  const msgObj = {
    user: username,
    text: text,
    time: Date.now(),
    delivered: true,
    read: false
  };
  chatRef.push(msgObj);
  messageInput.value = '';
}

// clear chat
clearBtn.addEventListener('click', () => {
  chatRef.remove();
});

// show typing
typingRef.on('value', snap => {
  const val = snap.val();
  if (val && val !== username) {
    typingStatusDiv.innerText = val + ' is typing...';
  } else {
    typingStatusDiv.innerText = '';
  }
});

// read messages + display
chatRef.on('value', snap => {
  messagesDiv.innerHTML = '';
  snap.forEach(child => {
    const msg = child.val();
    const div = document.createElement('div');
    div.classList.add('message');
    if (msg.user === username) {
      div.classList.add('me');
    } else {
      div.classList.add('other');
    }
    div.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}
      <span class="ticks">${msg.delivered ? '✓' : ''}${msg.read ? '✓' : ''}</span>`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});