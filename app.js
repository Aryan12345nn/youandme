let username = '';
let replyTo = null;

const userSelection = document.getElementById('userSelection');
const chatContainer = document.getElementById('chatContainer');
const chatUserHeader = document.getElementById('chatUser');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const typingHeader = document.getElementById('typingHeader');
const replyPreview = document.getElementById('replyPreview');
const replyText = document.getElementById('replyText');
const cancelReplyBtn = document.getElementById('cancelReply');
const statusContainer = document.getElementById('statusContainer');

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
const statusRef = db.ref('status');

// --- User selection ---
document.querySelectorAll('.user-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    username = btn.dataset.user;
    chatUserHeader.innerText = 'Chat - ' + username;
    userSelection.style.display = 'none';
    chatContainer.style.display = 'flex';
    
    // Set online
    const myStatusRef = statusRef.child(username);
    myStatusRef.set({online:true, lastActive:Date.now()});
    myStatusRef.onDisconnect().set({online:false, lastActive:Date.now()});
  });
});

// --- Send message ---
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e=>{
  if(e.key==='Enter') sendMessage();
  typingRef.set(username);
  setTimeout(()=> typingRef.remove(), 1000);
});

function sendMessage(){
  const text = messageInput.value.trim();
  if(!text) return;
  const msgObj = {user:username,text,time:Date.now()};
  if(replyTo) msgObj.reply = replyTo.text;
  chatRef.push(msgObj);
  messageInput.value='';
  replyTo = null;
  replyPreview.style.display='none';
}

// --- Clear chat ---
clearBtn.addEventListener('click', ()=>{
  if(confirm('Clear all chat?')) chatRef.remove();
});

// --- Typing indicator ---
typingRef.on('value', snap=>{
  const val = snap.val();
  typingHeader.innerText = val && val!==username ? val+' is typing...' : '';
});

// --- Show messages ---
chatRef.on('value', snap=>{
  messagesDiv.innerHTML='';
  snap.forEach(child=>{
    const msg = child.val();
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.user===username?'self':'other');
    let html = `<strong>${msg.user}:</strong> ${msg.text}`;
    if(msg.reply) html = `<div class="reply">${msg.reply}</div>` + html;
    div.innerHTML = html;

    // reply click
    div.addEventListener('click', ()=>{ 
      replyTo={text:msg.text};
      replyPreview.style.display='block';
      replyText.innerText=msg.text;
    });

    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// --- Cancel reply ---
cancelReplyBtn.addEventListener('click', ()=>{
  replyTo = null;
  replyPreview.style.display='none';
});

// --- Show online status ---
statusRef.on('value', snap=>{
  let txt='';
  snap.forEach(child=>{
    const val = child.val();
    txt += `${child.key} - ${val.online?'online':'offline'} | `;
  });
  statusContainer.innerText = txt.slice(0,-3);
});
