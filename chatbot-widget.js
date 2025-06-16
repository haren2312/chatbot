(function () {
  // ---- CONFIGURATION ----
  const IMAGES = {
    logo: 'http://localhost:8888/code/chatbot-widget/images/logo.jpg',
    chatIcon: 'http://localhost:8888/code/chatbot-widget/images/chat-icon.png',
    closeIcon: 'http://localhost:8888/code/chatbot-widget/images/close-icon.png',
    crispMsg: 'http://localhost:8888/code/chatbot-widget/images/crsip-msg.png'
  };
  const CSS_URL = 'http://localhost:8888/code/chatbot-widget/chatbot-widget.css';

  // ---- INJECT CSS ----
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = CSS_URL;
  document.head.appendChild(style);

  // ---- INJECT HTML ----
  const widgetHTML = `
  <button id="chatbot-toggle">
    <img id="chat-icon-img" src="${IMAGES.chatIcon}" />
    <img id="close-icon-img" src="${IMAGES.closeIcon}" style="display:none;position:absolute;left:10px;top:10px;" />
  </button>
  <div id="chat-container">
    <div id="name-prompt" class="prompt-box">
      <div class="prompt-header">
        <div class="bot-avatar"><img src="${IMAGES.logo}" alt="Bot Avatar" class="bot-avatar" /></div>
        <div>
          <h3 class="prompt-title">Welcome to E-invite</h3>
          <p class="prompt-subtitle">Your Virtual Assistant</p>
        </div>
      </div>
      <div class="prompt-content">
        <label for="nameInput" class="prompt-label">What's your name?</label>
        <input id="nameInput" type="text" placeholder="Enter your name..." />
        <button id="start-btn">Next</button>
      </div>
    </div>
    <div id="email-prompt" class="prompt-box" style="display:none;">
      <div class="prompt-header">
        <div class="bot-avatar"><img src="${IMAGES.logo}" alt="Bot Avatar" class="bot-avatar" /></div>
        <div>
          <h3 class="prompt-title">Email Required</h3>
          <p class="prompt-subtitle">We'll keep you updated</p>
        </div>
      </div>
      <div class="prompt-content">
        <label for="emailInput" class="prompt-label">Please enter your email:</label>
        <input id="emailInput" type="email" placeholder="Your email..." />
        <button id="email-btn">Submit Email</button>
      </div>
    </div>
    <div id="location-prompt" class="prompt-box" style="display:none;">
      <div class="prompt-header">
        <div class="bot-avatar">📍</div>
        <div>
          <h3 class="prompt-title">Location Access</h3>
          <p class="prompt-subtitle">For better assistance</p>
        </div>
      </div>
      <div class="prompt-content">
        <label class="prompt-label">Please share your location for personalized service:</label>
        <button id="location-btn">Share Location</button>
        <button id="skip-location-btn" style="background: #6b7280;">Skip for Now</button>
        <p id="location-status"></p>
      </div>
    </div>
    <div id="chat" class="chat-bot-bg" style="display:none;">
      <div class="chat-header">
        <div class="chat-header-top">
          <button class="crisp-chat-btn">
            <span class="chat-icon-circle">
              <img src="${IMAGES.crispMsg}" alt="Chat Icon" class="chat-icon" />
            </span>
            <span class="chat-btn-label">Chat</span>
          </button>
        </div>
        <div class="chat-header-main">
          <img src="${IMAGES.logo}" class="header-avatar" />
          <div class="header-info">
            <div class="header-title">E from E inviter</div>
          </div>
        </div>
      </div>
      <div id="messages" class="chat-messages"></div>
      <div id="typing-indicator" style="display:none;margin:6px 0 0 16px;"></div>
      <div class="input-wrapper">
        <div class="input-row">
          <input id="input" type="text" placeholder="Type your message..." />
        </div>
        <div class="input-actions">
          <input type="file" id="imageUpload" accept="image/*" style="display:none;">
          <button id="upload-btn" class="upload-button">🔗</button>
          <button id="emoji-btn" type="button">❤︎</button>
          <button id="send-btn" class="send-button">➤</button>
          <div id="emoji-picker" style="display:none;position:absolute;bottom:40px;left:110px;z-index:1000;background:#fff;padding:6px 10px;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
        </div>
      </div>
    </div>
  </div>
  `;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = widgetHTML;
  document.body.appendChild(wrapper);

  // ---- LOAD FIREBASE & SWEETALERT ----
  function loadScript(src, callback) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = callback;
    document.head.appendChild(s);
  }
  loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js', () => {
    loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js', () => {
      loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js', () => {
        loadScript('https://cdn.jsdelivr.net/npm/sweetalert2@11', widgetLogic);
      });
    });
  });

  // --- FULL CHATBOT LOGIC WITHOUT PREFIXES OR $() ---
  function widgetLogic() {
    // FIREBASE CONFIG
    const firebaseConfig = {
      apiKey: "AIzaSyCuzXtnMzjJ76N8PH-I4ZND5NnyVfD3XjE",
      authDomain: "chatbot-0405.firebaseapp.com",
      databaseURL: "https://chatbot-0405-default-rtdb.firebaseio.com",
      projectId: "chatbot-0405",
      storageBucket: "chatbot-0405.firebasestorage.app",
      messagingSenderId: "62504000476",
      appId: "1:62504000476:web:c1a92e6fa1db26b1668d19",
      measurementId: "G-5SSERC2EG6"
    };
    let app, db, storage;
    try {
      app = firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      storage = firebase.storage();
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }


    window.skipLocation = skipLocation;


    // GLOBALS
  let sessionId = "", userName = "", userEmail = "", userLocation = null, chatInitialized = false;
  let presenceTimers = { away: null, offline: null };
  let windowLastMessageDate = undefined;

  function sanitizeEmail(email) {
    return email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  }
  function updateSessionIdFromStorage() {
    const email = localStorage.getItem("chatbot_user_email") || "";
    sessionId = email ? sanitizeEmail(email) : "";
  }

  function bootstrapChat() {
    updateSessionIdFromStorage();
    const savedEmail = localStorage.getItem("chatbot_user_email");
    const savedName = localStorage.getItem("chatbot_user_name");
    if (savedEmail && savedName) {
      userName = savedName;
      userEmail = savedEmail;
      document.getElementById("name-prompt").style.display = "none";
      document.getElementById("email-prompt").style.display = "none";
      document.getElementById("location-prompt").style.display = "none";
      document.getElementById("chat").style.display = "flex";
      chatInitialized = true;
      loadChatMessages(); // always uses current sessionId
    } else {
      document.getElementById("name-prompt").style.display = "block";
      document.getElementById("email-prompt").style.display = "none";
      document.getElementById("location-prompt").style.display = "none";
      document.getElementById("chat").style.display = "none";
    }
  }

    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function showError(message) { Swal.fire(message); }
    function showLoading(elementId, message) {
      const el = document.getElementById(elementId);
      if (el) {
        const btn = el.querySelector('button');
        if (btn) { btn.disabled = true; btn.textContent = message; }
      }
    }
    function hideLoading(elementId, originalText) {
      const el = document.getElementById(elementId);
      if (el) {
        const btn = el.querySelector('button');
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      }
    }

    // PRESENCE
    function setPresence(state) {
      if (!sessionId) return;
      db.ref('status/' + sessionId).set({
        state: state,
        last_changed: firebase.database.ServerValue.TIMESTAMP
      });
    }
    function refreshPresenceOnActivity() {
      if (presenceTimers.away) clearTimeout(presenceTimers.away);
      if (presenceTimers.offline) clearTimeout(presenceTimers.offline);
      setPresence("online");
      presenceTimers.away = setTimeout(() => setPresence("away"), 2 * 60 * 1000);
      presenceTimers.offline = setTimeout(() => setPresence("offline"), 5 * 60 * 1000);
    }

    // localStorage.setItem("chatbot_location_set", "1");


    // ON LOAD
// function initializePrompts() {
//   let savedName = localStorage.getItem("chatbot_user_name") || "";
//   let savedEmail = localStorage.getItem("chatbot_user_email") || "";
//   let locationSet = localStorage.getItem("chatbot_location_set") === "1";
//   document.getElementById("nameInput").value = savedName;
//   document.getElementById("emailInput").value = savedEmail;
//   if (savedName && savedEmail && locationSet) {
//     userName = savedName;
//     userEmail = savedEmail;
//     // Always use sanitized version!
//     sessionId = sanitizeEmail(localStorage.getItem("chatbot_user_email") || "");
//     document.getElementById("name-prompt").style.display = "none";
//     document.getElementById("email-prompt").style.display = "none";
//     document.getElementById("location-prompt").style.display = "none";
//     document.getElementById("chat").style.display = "flex";
//     chatInitialized = true;
//     setTimeout(() => initializeChat(), 100); // short delay for DOM ready

//   } else if (savedName && savedEmail) {
//     userName = savedName;
//     userEmail = savedEmail;
//     // Always use sanitized version!
//     sessionId = sanitizeEmail(localStorage.getItem("chatbot_user_email") || "");
//     document.getElementById("name-prompt").style.display = "none";
//     document.getElementById("email-prompt").style.display = "none";
//     document.getElementById("location-prompt").style.display = "block";
//   } else {
//     document.getElementById("name-prompt").style.display = "block";
//     document.getElementById("email-prompt").style.display = "none";
//     document.getElementById("location-prompt").style.display = "none";
//     document.getElementById("chat").style.display = "none";
//   }
// }


    // NAME PROMPT
    document.getElementById("start-btn").onclick = function () {
  userName = document.getElementById("nameInput").value.trim();
  if (!userName) { showError("Please enter your name"); document.getElementById("nameInput").focus(); return; }
  localStorage.setItem("chatbot_user_name", userName);
  document.getElementById("name-prompt").style.display = "none";
  document.getElementById("email-prompt").style.display = "block";
  setTimeout(() => document.getElementById("emailInput").focus(), 100);
};

    document.getElementById("nameInput").addEventListener("keypress", function(e) {
      if (e.key === "Enter") document.getElementById("start-btn").click();
    });

    // EMAIL PROMPT
    document.getElementById("email-btn").onclick = function () {
      userEmail = document.getElementById("emailInput").value.trim().toLowerCase();
      if (!userEmail || !validateEmail(userEmail)) {
        showError("Please enter a valid email address");
        document.getElementById("emailInput").focus();
        return;
      }
      localStorage.setItem("chatbot_user_email", userEmail);
      sessionId = sanitizeEmail(userEmail);
      showLoading("email-prompt", "Saving...");
      db.ref("users/" + sessionId).set({
        name: userName, email: userEmail, timestamp: Date.now()
      }).then(() => {
        hideLoading("email-prompt", "Submit Email");
        document.getElementById("email-prompt").style.display = "none";
        document.getElementById("location-prompt").style.display = "block";
      }).catch(() => {
        hideLoading("email-prompt", "Submit Email");
        showError("Error saving data. Please try again.");
      });
    };
    document.getElementById("emailInput").addEventListener("keypress", function(e) {
      if (e.key === "Enter") document.getElementById("email-btn").click();
    });

    // LOCATION PROMPT
    document.getElementById("location-btn").onclick = function () {
  const status = document.getElementById("location-status");
  if (!navigator.geolocation) {
    status.textContent = "Geolocation is not supported by your browser."; 
    setTimeout(skipLocation, 2000); 
    return;
  }
  status.textContent = "Getting location...";
  showLoading("location-prompt", "Getting Location...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude, timestamp: Date.now() };
      db.ref("users/" + sessionId + "/location").set(userLocation).catch(() => { });
      status.textContent = "Location saved! Starting chat...";
      hideLoading("location-prompt", "Share Location");
      // --- SET LOCATION FLAG HERE ---
      localStorage.setItem("chatbot_location_set", "1");
      document.getElementById("location-prompt").style.display = "none";
      setTimeout(initializeChat, 500);
    },
    () => {
      status.textContent = "Unable to retrieve your location.";
      hideLoading("location-prompt", "Share Location");
      setTimeout(skipLocation, 2000);
    }, { timeout: 10000, enableHighAccuracy: false }
  );
};

    document.getElementById("skip-location-btn").onclick = skipLocation;
function skipLocation() {
  // --- SET LOCATION FLAG HERE ---
  localStorage.setItem("chatbot_location_set", "1");
  document.getElementById("location-prompt").style.display = "none";
  setTimeout(() => initializeChat(), 100); // short delay for DOM ready

  listenForAgentTyping();
}


// localStorage.setItem("chatbot_location_set", "1");


    function setupUserPresence() {
  if (!sessionId) return;
  const statusRef = db.ref('status/' + sessionId);

  db.ref('.info/connected').on('value', function(snapshot) {
    if (snapshot.val() === false) return;

    // Set offline when connection drops or tab closes
    statusRef.onDisconnect().set({
      state: "offline",
      last_changed: firebase.database.ServerValue.TIMESTAMP
    });

    // Set online when connected
    statusRef.set({
      state: "online",
      last_changed: firebase.database.ServerValue.TIMESTAMP
    });
  });

  // Idle: set "away"
  let idleTimer;
  function goAway() {
    statusRef.set({ state: "away", last_changed: firebase.database.ServerValue.TIMESTAMP });
  }
  function activity() {
    statusRef.set({ state: "online", last_changed: firebase.database.ServerValue.TIMESTAMP });
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(goAway, 2 * 60 * 1000); // 2 min
  }
  window.onmousemove = window.onkeydown = activity;
  activity(); // Trigger immediately
}

    // INITIALIZE CHAT
function initializeChat() {
  if (chatInitialized) return;
  document.getElementById("chat").style.display = "flex";
  chatInitialized = true;
  const chatRef = db.ref("chats/" + sessionId);
  chatRef.once("value", (snapshot) => {
    if (!snapshot.exists()) {
      const greetingMsg = {
        sender: "bot",
        message: `Hi ${userName}! 👋 How can I help you ?`,
        type: "text",
        timestamp: Date.now()
      };
      db.ref("chats/" + sessionId).push(greetingMsg).then(() => { loadChatMessages(); });
      sessionStorage.setItem('greeted', 'true');
    } else {
      console.log("sessionId used for chat:", sessionId);
      console.log("Checking if chat exists at /chats/" + sessionId);
      loadChatMessages();
    }
  });
  refreshPresenceOnActivity();
  setupUserPresence();
  setTimeout(() => { document.getElementById("input").focus(); }, 100);
}



    function sendMessage(message, type = "text") {
  if (!db || !sessionId || !message) return;
  const newMsgRef = db.ref("chats/" + sessionId).push();
  newMsgRef.set({
    message,
    sender: "user",
    type,
    timestamp: Date.now()
  }).then(() => {
    addMessage(message, "user", userName, Date.now(), newMsgRef.key);
  });
}



    // LOAD & RENDER MESSAGES
function loadChatMessages(callback) {
  updateSessionIdFromStorage();
  if (!sessionId) return;
  const chatRef = db.ref("chats/" + sessionId);
  const messagesContainer = document.getElementById("messages");
  messagesContainer.innerHTML = "";
  windowLastMessageDate = undefined;
  chatRef.off();
  const messageElements = {};
  chatRef.on("child_added", (snapshot) => {
    const data = snapshot.val();
    const msgDiv = addMessage(data.message, data.sender, null, data.timestamp, snapshot.key);
    if (msgDiv) {
      messageElements[snapshot.key] = msgDiv;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
      chatRef.on("child_removed", (snapshot) => {
        if (messageElements[snapshot.key]) {
          messageElements[snapshot.key].remove();
          delete messageElements[snapshot.key];
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
      if (typeof callback === "function") callback();
    }





function addMessage(text, sender, name, timestamp = Date.now(), messageKey = null, container = null) {
  const messagesContainer = container || document.getElementById("messages");
      const now = new Date(timestamp);
      const dayString = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      if (windowLastMessageDate !== dayString) {
        const dateLine = document.createElement("div");
        dateLine.className = "timestamp-line";
        dateLine.textContent = dayString;
        messagesContainer.appendChild(dateLine);
        windowLastMessageDate = dayString;
      }
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  if (messageKey) msgDiv.dataset.key = messageKey;
      if (sender === "bot" || sender === "agent") {
        const headerDiv = document.createElement("div");
        headerDiv.className = "msg-header";
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "avatar";
        avatarDiv.innerHTML = `<img src="${IMAGES.logo}" alt="${sender}" />`;
        const nameSpan = document.createElement("span");
        nameSpan.className = "sender-name";
        nameSpan.textContent = name || (sender === "bot" ? "E Inviter" : "Admin");
        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(nameSpan);
        msgDiv.appendChild(headerDiv);
      }
      const bubbleDiv = document.createElement("div");
      bubbleDiv.className = "bubble";
      const msgContent = document.createElement("div");
      if (typeof text === 'string' && (text.match(/\.(jpeg|jpg|gif|png|webp)$/i) || text.startsWith("data:image/"))) {
        const img = document.createElement('img');
        img.src = text.startsWith('/') ? window.location.origin + text : text;
        img.alt = "Sent image";
        img.style.maxWidth = "200px";
        img.style.maxHeight = "150px";
        img.style.borderRadius = "8px";
        msgContent.appendChild(img);
      } else {
        msgContent.textContent = text;
      }
      bubbleDiv.appendChild(msgContent);
      const timeLabel = document.createElement("span");
      timeLabel.className = "msg-time";
      timeLabel.textContent = timeString;
      bubbleDiv.appendChild(timeLabel);
      if (sender === "user" && messageKey) {
        const msgActions = document.createElement("div");
        msgActions.className = "msg-actions";
        const menuBtn = document.createElement("button");
        menuBtn.className = "msg-menu";
        menuBtn.innerHTML = "&#8942;";
        const dropdown = document.createElement("div");
        dropdown.className = "msg-dropdown";
        dropdown.style.display = "none";
        dropdown.innerHTML = `
          <div class="msg-dropdown-item" data-action="edit">Edit</div>
          <div class="msg-dropdown-item" data-action="delete">Delete</div>
          <div class="msg-dropdown-item" data-action="copy">Copy</div>
        `;
        menuBtn.onclick = (e) => {
          e.stopPropagation();
          document.querySelectorAll('.msg-dropdown').forEach(el => el.style.display = "none");
          dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        };
        document.addEventListener("click", (event) => {
          if (!msgActions.contains(event.target)) dropdown.style.display = "none";
        });
        dropdown.addEventListener("click", function(e) {
          if (!e.target.classList.contains("msg-dropdown-item")) return;
          dropdown.style.display = "none";
          const action = e.target.dataset.action;
          if (action === "edit") editMessageFromFirebase(messageKey, msgContent, bubbleDiv);
          else if (action === "delete") deleteMessageFromFirebase(messageKey);
          else if (action === "copy") copyMessageToClipboard(msgContent);
        });
        msgActions.appendChild(menuBtn);
        msgActions.appendChild(dropdown);
        bubbleDiv.appendChild(msgActions);
      }
      msgDiv.appendChild(bubbleDiv);
if (!container) {
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
} else {
  container.appendChild(msgDiv); // <--- CORRECTED LINE
}
return msgDiv;
    }
    function editMessageFromFirebase(messageKey, msgContent, bubbleDiv) {
      const currentText = msgContent.textContent || "";
      const newText = prompt("Edit your message:", currentText);
      if (newText !== null && newText.trim() !== "" && newText !== currentText) {
        db.ref("chats/" + sessionId + "/" + messageKey).update({
          message: newText, edited: true
        }).then(() => { msgContent.textContent = newText; });
      }
    }
    function deleteMessageFromFirebase(messageKey) {
      if (!sessionId || !messageKey) return;
      if (confirm("Are you sure you want to delete this message for everyone?")) {
        db.ref("chats/" + sessionId + "/" + messageKey).remove().then(() => {
          const msgDiv = document.querySelector(`[data-key="${messageKey}"]`);
          if (msgDiv) msgDiv.remove();
        });
      }
    }
    function copyMessageToClipboard(msgContent) {
      const text = typeof msgContent === "string" ? msgContent : msgContent.textContent;
      navigator.clipboard.writeText(text).then(() => { });
    }

    // SEND MESSAGE
    document.getElementById("send-btn").onclick = function () { sendMsg(); };
    document.getElementById("input").addEventListener("keypress", function (e) { if (e.key === "Enter") sendMsg(); });
    
    
    function sendMsg(customText) {
  updateSessionIdFromStorage();
  if (!sessionId) return;
  const input = document.getElementById("input");
  const msg = (customText || input.value).trim();
  if (!msg) return;
  db.ref("chats/" + sessionId).push({
    sender: "user", message: msg, type: "text", timestamp: Date.now()
  });
  refreshPresenceOnActivity();
  if (!customText) input.value = "";
}


function addImageMessage(url, sender) {
  addMessage(url, sender);
}

function presetClick(message) {
  sendMsg(message);
}
    // UPLOAD IMAGE
    document.getElementById("upload-btn").onclick = function () { document.getElementById("imageUpload").click(); };
    document.getElementById("imageUpload").onchange = function () { uploadImage(); };
    
    
    const cloudName = "drrnur7f1";
const uploadPreset = "einvite_upload";

function uploadImage() {
  const fileInput = document.getElementById("imageUpload");
  const file = fileInput.files[0];
  if (!file) return;

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  fetch(url, { method: "POST", body: formData })
    .then(r => r.json())
    .then(data => {
      if (data.secure_url) {
        // Use data.secure_url as your image URL in chat!
        // Send to Firebase Realtime Database or wherever you want
        db.ref("chats/" + sessionId).push({
          sender: "user",
          message: data.secure_url,
          type: "image",
          timestamp: Date.now()
        });
      } else {
        alert("Upload failed.");
      }
    });
}

    // EMOJI PICKER
    document.getElementById("emoji-btn").onclick = function () {
      const picker = document.getElementById("emoji-picker");
      picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
    };
    document.getElementById("emoji-picker").onclick = function (e) {
      const input = document.getElementById("input");
      if (e.target.tagName === 'SPAN') {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + e.target.textContent + input.value.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + e.target.textContent.length;
        document.getElementById("emoji-picker").style.display = 'none';
      }
    };
    const emojis = ["😀","😂","😍","🥰","😎","😭","😡","😱","👍","🙏","🎉","🎂","🔥","🤔","🤖","❤️"];
    document.getElementById("emoji-picker").innerHTML = emojis.map(e => `<span style="cursor:pointer;font-size:22px;padding:2px;">${e}</span>`).join('');
    document.addEventListener('click', function (e) {
      if (!document.getElementById("emoji-btn").contains(e.target) && !document.getElementById("emoji-picker").contains(e.target)) {
        document.getElementById("emoji-picker").style.display = 'none';
      }
    });

    // TOGGLE BUTTON
    document.getElementById("chatbot-toggle").onclick = function () {
      const chatContainer = document.getElementById("chat-container");
      const chatIcon = document.getElementById("chat-icon-img");
      const closeIcon = document.getElementById("close-icon-img");
      const isVisible = chatContainer.style.display === "flex";
      chatContainer.style.display = isVisible ? "none" : "flex";
      chatIcon.style.display = isVisible ? "block" : "none";
      closeIcon.style.display = isVisible ? "none" : "block";
      setTimeout(() => {
        if (document.getElementById("name-prompt").style.display !== "none") document.getElementById("nameInput").focus();
        else if (document.getElementById("email-prompt").style.display !== "none") document.getElementById("emailInput").focus();
        else if (document.getElementById("chat").style.display !== "none") document.getElementById("input").focus();
      }, 100);
    };

    // TYPING INDICATOR (OPTIONAL)
function showTypingIndicator(who) {
  const el = document.getElementById("typing-indicator");
  el.style.display = "block";
  el.innerHTML = `
    <span style="display:inline-block;">
      <span style="color:#1877f2;font-weight:600;">
        ${who === "agent" ? "Agent" : "User"} is typing
      </span>
      <span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </span>
  `;
}

function listenForAgentTyping() {
  if (!db || !sessionId) return;
  const typingRef = db.ref("typing/" + sessionId + "/agent");
  typingRef.on("value", (snapshot) => {
    if (snapshot.val()) {
      showTypingIndicator("agent");
    } else {
      hideTypingIndicator();
    }
  });
}


function setTyping(isTyping) {
  if (!db || !sessionId) return;
  db.ref("typing/" + sessionId + "/user").set(isTyping);
}

function hideTypingIndicator() {
  document.getElementById("typing-indicator").style.display = "none";
}



    // Error handling
    window.addEventListener('unhandledrejection', function (event) {
      event.preventDefault();
    });
  // initializePrompts();
  
  window.onload = bootstrapChat;
}

window.addEventListener("DOMContentLoaded", function () {
  // 1. Try to detect main color from most common real site elements
  let primary =
    getComputedStyle(document.querySelector('a'))?.color ||
    getComputedStyle(document.querySelector('button'))?.backgroundColor ||
    getComputedStyle(document.body).color ||
    "#1877f2"; // Fallback blue

  let background =
    getComputedStyle(document.body).backgroundColor ||
    "#ffffff"; // Fallback white

  // 2. Find the chatbot container
  var chatRoot = document.getElementById('chat-container');
  if (chatRoot) {
    // 3. Set theme for chatbot only
    chatRoot.style.setProperty('--primary', primary);
    chatRoot.style.setProperty('--background', background);
  }
});

})();



