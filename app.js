import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 🔹 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAyLfQR-k8L45imDdx0N-5pw8P43_pmJ8E",
  authDomain: "youandme12345-d1d17.firebaseapp.com",
  projectId: "youandme12345-d1d17",
  storageBucket: "youandme12345-d1d17.firebasestorage.app",
  messagingSenderId: "500541583420",
  appId: "1:500541583420:web:ec35f7355884fb6e345339",
  databaseURL: "https://youandme12345-d1d17-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Ask user on load (popup)
let username = "";
while (username !== "ishu" && username !== "billi") {
  username = prompt("Select your user: ishu or billi").toLowerCase();
}

// Status references
const ishuStatus = document.getElementById('ishuStatus');
const billiStatus = document.getElementById('billiStatus');

// Typing reference
const messagesRef = ref(database, 'messages');

// Listen for new messages
onChildAdded(messagesRef, (data) => {
  const msg = data.val();
  displayMessage(msg.user, msg.text, msg.timestamp);
});

// Send message
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msgInput = document.getElementById('messageInput');
  const text = msgInput.value.trim();
  if (text === "") return;
  push(messagesRef, {
    user: username,
    text: text,
    timestamp: serverTimestamp()
  });
  msgInput.value = "";
}

function displayMessage(user, text, timestamp) {
  const chatBox = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.classList.add('message', user);
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🔹 Clear Chat
document.getElementById('clearChatBtn').addEventListener('click', () => {
  if (confirm('Clear all chat messages?')) {
    set(messagesRef, {}); // clears messages node
    document.getElementById('chatBox').innerHTML = '';
  }
});