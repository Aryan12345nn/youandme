// app.js - uses Firebase modular SDK v12.3.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getDatabase, ref, push, onChildAdded, onChildChanged,
  onValue, update, set, serverTimestamp, onDisconnect, get
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

// ---------- Firebase config (already your project) ----------
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
const db = getDatabase(app);

// refs
const messagesRef = ref(db, "messages");
const usersRef = ref(db, "users");

// DOM
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const stickerBtn = document.getElementById("stickerBtnFloat");
const stickerPopup = document.getElementById("stickerPopup");
const userPopup = document.getElementById("userPopup");
const ishuStatusEl = document.getElementById("ishuStatus");
const billiStatusEl = document.getElementById("billiStatus");
const clearChatBtn = document.getElementById("clearChatBtn");

// runtime
let currentUser = null;
let messageElements = {}; // key -> element
let typingBubbleEl = null;

// ---------- helper: render tick HTML ----------
function tickHTML(status){
  if(status === "sent") return `<span class="tick">✓</span>`;
  if(status === "delivered") return `<span class="tick">✓✓</span>`;
  if(status === "read") return `<span class="tick read">✓✓</span>`;
  return "";
}

// ---------- select user ----------
window.selectUser = function(name){
  currentUser = name; // "Ishu" or "Billi"
  userPopup.style.display = "none";
  // set online, set onDisconnect fallback
  const myUserRef = ref(db, `users/${currentUser}`);
  update(myUserRef, { online: true, lastActive: serverTimestamp(), typing: false }).catch(console.error);

  // ensure onDisconnect will set them offline & lastActive
  const od = onDisconnect(myUserRef);
  od.update({ online: false, lastActive: serverTimestamp(), typing: false }).catch(()=>{ /* ignore */ });

  // start listening / UI
  startListeners();
};

// ---------- listeners ----------
function startListeners(){
  // when new message arrives
  onChildAdded(messagesRef, (snap) => {
    const key = snap.key;
    const msg = snap.val();
    renderMessage(key, msg);

    // If this message is for me (i.e., sender != me) and status == 'sent', mark delivered
    if(msg.sender !== currentUser && msg.status === "sent"){
      update(ref(db, `messages/${key}`), { status: "delivered" }).catch(console.error);
    }
  });

  // when a message changes (e.g., status updated)
  onChildChanged(messagesRef, (snap) => {
    const key = snap.key;
    const msg = snap.val();
    updateMessageStatus(key, msg);
  });

  // users presence & typing
  onValue(usersRef, (snap) => {
    const users = snap.val() || {};
    updateUserStatusUI(users);
  });

  // when window gains focus, mark other user's delivered messages as read
  window.addEventListener("focus", markMessagesRead);
}

// ---------- render message ----------
function renderMessage(key, msg){
  // create element or reuse if exists
  if(messageElements[key]) return; // already rendered
  const el = document.createElement("div");
  el.className = "message";
  el.dataset.key = key;

  const isMine = msg.sender === currentUser;
  el.classList.add(isMine ? "me" : "other");

  // content: sticker or text
  if(msg.sticker && msg.sticker !== ""){
    el.innerHTML = `<img src="${msg.sticker}" alt="sticker">` + (isMine ? tickHTML(msg.status) : "");
  } else {
    // escape text (basic)
    const safeText = (msg.text || "").replaceAll("<","&lt;").replaceAll(">","&gt;");
    el.innerHTML = `<span class="text">${safeText}</span>` + (isMine ? tickHTML(msg.status) : "");
  }

  // append and save ref
  chatBox.appendChild(el);
  messageElements[key] = el;
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ---------- update message status UI ----------
function updateMessageStatus(key, msg){
  const el = messageElements[key];
  if(!el) return;
  // only show ticks for my messages
  if(msg.sender === currentUser){
    // remove existing tick
    const existingTick = el.querySelector(".tick");
    if(existingTick) existingTick.remove();
    // append new tick
    el.insertAdjacentHTML("beforeend", tickHTML(msg.status));
  }
}

// ---------- mark messages read ----------
async function markMessagesRead(){
  if(!currentUser) return;
  const snap = await get(messagesRef);
  if(!snap.exists()) return;
  const updates = {};
  snap.forEach(child => {
    const key = child.key;
    const m = child.val();
    if(m.sender !== currentUser && m.status !== "read"){
      updates[`messages/${key}/status`] = "read";
    }
  });
  if(Object.keys(updates).length) {
    update(ref(db), updates).catch(console.error);
  }
}

// ---------- typing handling ----------
let typingTimer = null;
messageInput.addEventListener("input", () => {
  if(!currentUser) return;
  update(ref(db, `users/${currentUser}`), { typing: messageInput.value.length > 0 }).catch(console.error);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    if(currentUser) update(ref(db, `users/${currentUser}`), { typing: false }).catch(console.error);
  }, 1500);
});

// show/remove typing bubble for other user(s)
function showTypingBubble(user){
  removeTypingBubble();
  typingBubbleEl = document.createElement("div");
  typingBubbleEl.className = "typing-bubble";
  typingBubbleEl.innerHTML = `${user} is typing… <span class="typing-dots">● ● ●</span>`;
  // place at end of chat
  chatBox.appendChild(typingBubbleEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function removeTypingBubble(){
  if(typingBubbleEl && typingBubbleEl.parentNode) typingBubbleEl.parentNode.removeChild(typingBubbleEl);
  typingBubbleEl = null;
}

// ---------- user status UI ----------
function updateUserStatusUI(users){
  const ishu = users["Ishu"] || {};
  const billi = users["Billi"] || {};

  // helper to format lastActive
  const fmt = ts => {
    if(!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString();
  };

  // Ishu
  if(ishu.online){
    ishuStatusEl.textContent = `Ishu (online)${ishu.typing ? " • typing…" : ""}`;
  } else if(ishu.lastActive){
    ishuStatusEl.textContent = `Ishu (last active: ${fmt(ishu.lastActive)})`;
  } else {
    ishuStatusEl.textContent = `Ishu (offline)`;
  }

  // Billi
  if(billi.online){
    billiStatusEl.textContent = `Billi (online)${billi.typing ? " • typing…" : ""}`;
  } else if(billi.lastActive){
    billiStatusEl.textContent = `Billi (last active: ${fmt(billi.lastActive)})`;
  } else {
    billiStatusEl.textContent = `Billi (offline)`;
  }

  // in-chat typing bubble: if other user typing, show bubble
  const other = currentUser === "Ishu" ? "Billi" : "Ishu";
  if(users[other] && users[other].typing){
    showTypingBubble(other);
  } else {
    removeTypingBubble();
  }
}

// ---------- send message ----------
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => { if(e.key === "Enter") sendMessage(); });

function sendMessage(){
  if(!currentUser) return;
  const text = messageInput.value.trim();
  if(!text) return;
  const newRef = push(messagesRef);
  newRef.set({
    sender: currentUser,
    text,
    sticker: "",
    status: "sent",
    timestamp: serverTimestamp()
  }).catch(console.error);
  // stop typing
  update(ref(db, `users/${currentUser}`), { typing: false }).catch(console.error);
  messageInput.value = "";
}

// ---------- sticker logic ----------
stickerBtn.addEventListener("click", () => {
  stickerPopup.style.display = stickerPopup.style.display === "flex" ? "none" : "flex";
});
document.querySelectorAll(".sticker-popup .sticker, #stickerPopup .sticker").forEach(img => {
  img.addEventListener("click", () => {
    if(!currentUser) return;
    const url = img.src;
    push(messagesRef, {
      sender: currentUser,
      text: "",
      sticker: url,
      status: "sent",
      timestamp: serverTimestamp()
    }).catch(console.error);
    stickerPopup.style.display = "none";
  });
});

// ---------- clear chat button ----------
clearChatBtn.addEventListener("click", async () => {
  if(!confirm("Clear all chat messages? This cannot be undone.")) return;
  // overwrite with an empty object (or set null)
  await set(messagesRef, {});
  chatBox.innerHTML = "";
  messageElements = {};
});

// ---------- on unload: mark offline & lastActive ----------
window.addEventListener("beforeunload", () => {
  if(!currentUser) return;
  update(ref(db, `users/${currentUser}`), { online: false, lastActive: serverTimestamp(), typing: false }).catch(()=>{});
});

// ---------- helper: update message UI when status changes (already handled in onChildChanged above) ----------
// (no extra code needed)

// ---------- done ----------
/* Note: If you want messages to auto-mark 'read' as soon as they're visible, we call markMessagesRead
   when window focuses; you can also call it when the chatBox scrolls to the bottom or on child_added.
*/
window.addEventListener('focus', markMessagesRead);
