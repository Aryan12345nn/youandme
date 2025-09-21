let username = '';
let replyTo = null;
let typingTimeout;
let typingInterval;

// DOM elements
const userSelection = document.getElementById('userSelection');
const chatContainer = document.getElementById('chatContainer');
const chatUserHeader = document.getElementById('chatUser');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const typingHeader = document.getElementById('typingHeader');
const chatTyping = document.getElementById('chatTyping');
const replyPreview = document.getElementById('replyPreview');
const replyText = document.getElementById('replyText');
const cancelReplyBtn = document.getElementById('cancelReply');
const statusContainer = document.getElementById('statusContainer');
const stickerBtn = document.getElementById('stickerBtn');
const stickerPanel = document.getElementById('stickerPanel');

// Firebase setup
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

// --- Stickers ---
const stickerUrls = [];
const tags = ['cute','funny','sleepy','angry','silly','love','hello','grumpy','happy'];
for(let i=0;i<tags.length;i++){
  for(let j=0;j<6;j++){
    stickerUrls.push(`https://cataas.com/cat/${tags[i]}?width=100&height=100&random=${j}`);
  }
}
stickerPanel.style.display = 'none';
stickerUrls.forEach(url=>{
  const img = document.createElement('img');
  img.src = url;
  img.addEventListener('click', ()=> sendSticker(url));
  stickerPanel.appendChild(img);
});

// --- User selection ---
document.querySelectorAll('.user-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    username = btn.dataset.user;
    chatUserHeader.innerText = 'Chat';
    userSelection.style.display='none';
    chatContainer.style.display='flex';

    const myStatusRef = statusRef.child(username);
    myStatusRef.set({online:true,lastActive:Date.now()});
    myStatusRef.onDisconnect().set({online:false,lastActive:Date.now()});
  });
});

// --- Send message ---
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('input', ()=>{
  typingRef.set(username); // update typing
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(()=> typingRef.remove(), 1500);
});
messageInput.addEventListener('keydown', e=>{
  if(e.key==='Enter') sendMessage();
  setTimeout(()=> messagesDiv.scrollTop = messagesDiv.scrollHeight,200);
});

function sendMessage(){
  const text = messageInput.value.trim();
  if(!text) return;
  const msgObj = {user:username,text,time:Date.now()};
  if(replyTo) msgObj.reply = replyTo.text;
  chatRef.push(msgObj);
  messageInput.value='';
  replyTo=null;
  replyPreview.style.display='none';
}

// --- Send sticker ---
function sendSticker(url){
  const msgObj = {user:username,sticker:url,time:Date.now()};
  chatRef.push(msgObj);
  stickerPanel.style.display='none';
}

// --- Clear chat ---
clearBtn.addEventListener('click', ()=>{if(confirm('Clear all chat?')) chatRef.remove();});

// --- Typing indicator with animated dots ---
typingRef.on('value', snap=>{
  const val = snap.val();
  if(val && val!==username){
    let dotCount = 0;
    clearInterval(typingInterval);
    typingInterval = setInterval(()=>{
      dotCount = (dotCount + 1) % 4;
      const dots = '.'.repeat(dotCount);
      const text = `${val} is typing${dots}`;
      typingHeader.innerText = text;
      chatTyping.innerText = text;
    }, 500);
  } else {
    clearInterval(typingInterval);
    typingHeader.innerText = '';
    chatTyping.innerText = '';
  }
});

// --- Show messages ---
chatRef.on('value', snap=>{
  messagesDiv.innerHTML='';
  snap.forEach(child=>{
    const msg = child.val();
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.user===username?'self':'other');

    let html = '';
    if(msg.sticker){
      html = `<strong>${msg.user}:</strong><br><img src="${msg.sticker}" class="sticker"/>`;
    } else {
      html = `<strong>${msg.user}:</strong> ${msg.text}`;
      if(msg.reply) html = `<div class="reply">Reply: ${msg.reply}</div>`+html;
    }

    div.innerHTML = html;

    div.addEventListener('click', ()=>{
      if(!msg.sticker){
        replyTo={text:msg.text};
        replyPreview.style.display='block';
        replyText.innerText=msg.text;
      }
    });

    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop=messagesDiv.scrollHeight;
});

// --- Cancel reply ---
cancelReplyBtn.addEventListener('click', ()=>{replyTo=null; replyPreview.style.display='none';});

// --- Online status ---
statusRef.on('value', snap=>{
  let statusTexts = [];
  ['Ishu','Billi'].forEach(user=>{
    const val = snap.child(user).val();
    if(val) statusTexts.push(`${user} - ${val.online?'online':'offline'}`);
    else statusTexts.push(`${user} - offline`);
  });
  statusContainer.innerText = statusTexts.join(' | ');
});

// --- Sticker panel toggle ---
stickerBtn.addEventListener('click', ()=>{
  stickerPanel.style.display = stickerPanel.style.display==='flex'?'none':'flex';
  if(stickerPanel.style.display==='flex') stickerPanel.scrollLeft = 0;
});
