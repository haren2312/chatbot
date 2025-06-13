(function () {
  // ---- CONFIGURATION ----
  const PREFIX = 'chatbot-';
  const IMAGES = {
    logo: 'images/logo.jpg',
    chatIcon: 'images/chat-icon.png',
    closeIcon: 'images/close-icon.png',
    crispMsg: 'images/crsip-msg.png'
  };
  const CSS_URL = 'user_chat_interface.css';

  // ---- INJECT CSS ----
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = CSS_URL;
  document.head.appendChild(style);

  // ---- INJECT HTML ----
  const widgetHTML = `
  <button id="${PREFIX}chatbot-toggle">
    <img id="${PREFIX}chat-icon-img" src="${IMAGES.chatIcon}" />
    <img id="${PREFIX}close-icon-img" src="${IMAGES.closeIcon}" style="display:none;position:absolute;left:10px;top:10px;" />
  </button>
  <div id="${PREFIX}chat-container">
    <div id="${PREFIX}name-prompt" class="prompt-box">
      <div class="prompt-header">
        <div class="bot-avatar"><img src="${IMAGES.logo}" alt="Bot Avatar" class="bot-avatar" /></div>
        <div>
          <h3 class="prompt-title">Welcome to E-invite</h3>
          <p class="prompt-subtitle">Your Virtual Assistant</p>
        </div>
      </div>
      <div class="prompt-content">
        <label for="${PREFIX}nameInput" class="prompt-label">What's your name?</label>
        <input id="${PREFIX}nameInput" type="text" placeholder="Enter your name..." />
        <button id="${PREFIX}start-btn">Next</button>
      </div>
    </div>
    <div id="${PREFIX}email-prompt" class="prompt-box" style="display:none;">
      <div class="prompt-header">
        <div class="bot-avatar"><img src="${IMAGES.logo}" alt="Bot Avatar" class="bot-avatar" /></div>
        <div>
          <h3 class="prompt-title">Email Required</h3>
          <p class="prompt-subtitle">We'll keep you updated</p>
        </div>
      </div>
      <div class="prompt-content">
        <label for="${PREFIX}emailInput" class="prompt-label">Please enter your email:</label>
        <input id="${PREFIX}emailInput" type="email" placeholder="Your email..." />
        <button id="${PREFIX}email-btn">Submit Email</button>
      </div>
    </div>
    <div id="${PREFIX}location-prompt" class="prompt-box" style="display:none;">
      <div class="prompt-header">
        <div class="bot-avatar">📍</div>
        <div>
          <h3 class="prompt-title">Location Access</h3>
          <p class="prompt-subtitle">For better assistance</p>
        </div>
      </div>
      <div class="prompt-content">
        <label class="prompt-label">Please share your location for personalized service:</label>
        <button id="${PREFIX}location-btn">Share Location</button>
        <button id="${PREFIX}skip-location-btn" style="background: #6b7280;">Skip for Now</button>
        <p id="${PREFIX}location-status"></p>
      </div>
    </div>
    <div id="${PREFIX}chat" class="chat-bot-bg" style="display:none;">
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
      <div id="${PREFIX}messages" class="chat-messages"></div>
      <div id="${PREFIX}typing-indicator" style="display:none;margin:6px 0 0 16px;"></div>
      <hr style="width: 85%; margin-left: 20px; border: 1px solid #ebebeb;">
      <div class="input-row">
        <input id="${PREFIX}input" type="text" placeholder="Type your message..." />
      </div>
      <div style="text-align: end; padding: 0 5px 5px 0; background-color: white;">
        <input type="file" id="${PREFIX}imageUpload" accept="image/*" style="display:none;">
        <button id="${PREFIX}upload-btn" class="upload-button">🔗</button>
        <button id="${PREFIX}emoji-btn" type="button">❤︎</button>
        <button id="${PREFIX}send-btn" class="send-button">➤</button>
        <div id="${PREFIX}emoji-picker" style="display:none;position:absolute;bottom:40px;left:110px;z-index:1000;background:#fff;padding:6px 10px;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
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

  // ---- FULL CHATBOT LOGIC, PREFXIED ----
  function widgetLogic() {
    // --------------- FIREBASE CONFIG ---------------
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

    // --------------- GLOBALS & UTILS ---------------
    let sessionId = "", userName = "", userEmail = "", userLocation = null, chatInitialized = false;
    let presenceTimers = { away: null, offline: null };
    let windowLastMessageDate = undefined;

    function sanitizeEmail(email) {
      return email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
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

    // --------------- PRESENCE ---------------
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

    // --------------- UI EVENTS & LOGIC ---------------
    function $(id) { return document.getElementById(PREFIX + id); }

    // On load: populate localStorage name/email
    document.addEventListener("DOMContentLoaded", function() {
      let savedName = localStorage.getItem("chatbot_user_name") || "";
      let savedEmail = localStorage.getItem("chatbot_user_email") || "";
      $("nameInput").value = savedName;
      $("emailInput").value = savedEmail;
      $("name-prompt").style.display = "block";
      $("email-prompt").style.display = "none";
      $("location-prompt").style.display = "none";
      $("chat").style.display = "none";
    });

    // --------------- STEP 1: Name prompt ---------------
    $("start-btn").onclick = function () {
      userName = $("nameInput").value.trim();
      if (!userName) { showError("Please enter your name"); $("nameInput").focus(); return; }
      localStorage.setItem("chatbot_user_name", userName);
      $("name-prompt").style.display = "none";
      $("email-prompt").style.display = "block";
      setTimeout(() => $("emailInput").focus(), 100);
    };
    $("nameInput").addEventListener("keypress", function(e) {
      if (e.key === "Enter") $("start-btn").click();
    });

    // --------------- STEP 2: Email prompt ---------------
    $("email-btn").onclick = function () {
      userEmail = $("emailInput").value.trim().toLowerCase();
      if (!userEmail || !validateEmail(userEmail)) {
        showError("Please enter a valid email address");
        $("emailInput").focus();
        return;
      }
      localStorage.setItem("chatbot_user_email", userEmail);
      sessionId = sanitizeEmail(userEmail);
      showLoading(PREFIX + "email-prompt", "Saving...");
      db.ref("users/" + sessionId).set({
        name: userName, email: userEmail, timestamp: Date.now()
      }).then(() => {
        hideLoading(PREFIX + "email-prompt", "Submit Email");
        $("email-prompt").style.display = "none";
        $("location-prompt").style.display = "block";
      }).catch(() => {
        hideLoading(PREFIX + "email-prompt", "Submit Email");
        showError("Error saving data. Please try again.");
      });
    };
    $("emailInput").addEventListener("keypress", function(e) {
      if (e.key === "Enter") $("email-btn").click();
    });

    // --------------- STEP 3: Location prompt ---------------
    $("location-btn").onclick = function () {
      const status = $("location-status");
      if (!navigator.geolocation) {
        status.textContent = "Geolocation is not supported by your browser."; setTimeout(skipLocation, 2000); return;
      }
      status.textContent = "Getting location...";
      showLoading(PREFIX + "location-prompt", "Getting Location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude, timestamp: Date.now() };
          db.ref("users/" + sessionId + "/location").set(userLocation).catch(() => { });
          status.textContent = "Location saved! Starting chat...";
          hideLoading(PREFIX + "location-prompt", "Share Location");
          $("location-prompt").style.display = "none";
          setTimeout(initializeChat, 500);
        },
        () => {
          status.textContent = "Unable to retrieve your location.";
          hideLoading(PREFIX + "location-prompt", "Share Location");
          setTimeout(skipLocation, 2000);
        }, { timeout: 10000, enableHighAccuracy: false }
      );
    };
    $("skip-location-btn").onclick = skipLocation;
    function skipLocation() {
      $("location-prompt").style.display = "none";
      initializeChat();
    }

    // --------------- INITIALIZE CHAT ---------------
    function initializeChat() {
      if (chatInitialized) return;
      $("chat").style.display = "flex";
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
          loadChatMessages();
        }
      });
      refreshPresenceOnActivity();
      setTimeout(() => { $("input").focus(); }, 100);
    }

    // --------------- LOAD & RENDER MESSAGES ---------------
    function loadChatMessages(callback) {
      const chatRef = db.ref("chats/" + sessionId);
      const messagesContainer = $("messages");
      messagesContainer.innerHTML = "";
      windowLastMessageDate = undefined;
      chatRef.off();
      const messageElements = {};
      chatRef.on("child_added", (snapshot) => {
        const data = snapshot.val();
        const msgDiv = createOrUpdateMessageElement(data, snapshot.key);
        if (msgDiv) {
          messagesContainer.appendChild(msgDiv);
          messageElements[snapshot.key] = msgDiv;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
      chatRef.on("child_changed", (snapshot) => {
        const data = snapshot.val();
        const msgDiv = createOrUpdateMessageElement(data, snapshot.key, true);
        if (!messageElements[snapshot.key]) {
          if (msgDiv) {
            messagesContainer.appendChild(msgDiv);
            messageElements[snapshot.key] = msgDiv;
          }
        } else {
          if (msgDiv) {
            messagesContainer.replaceChild(msgDiv, messageElements[snapshot.key]);
            messageElements[snapshot.key] = msgDiv;
          }
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    function createOrUpdateMessageElement(data, messageKey, isUpdate = false) {
      const tempDiv = document.createElement('div');
      addMessage(data.message, data.sender, null, data.timestamp, messageKey, tempDiv);
      const msgNode = tempDiv.querySelector('.msg');
      if (!msgNode) { console.warn('No .msg element created for:', data); return null; }
      return msgNode;
    }
    function addMessage(text, sender, name, timestamp = Date.now(), messageKey = null, container = null) {
      const messagesContainer = container || $("messages");
      // DATE/TIME separator logic
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
      // MSG container
      const msgDiv = document.createElement("div");
      msgDiv.className = `msg ${sender}`;
      if (messageKey) msgDiv.dataset.key = messageKey;
      // Bot/Agent avatar header
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
      // Bubble
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
      // Time
      const timeLabel = document.createElement("span");
      timeLabel.className = "msg-time";
      timeLabel.textContent = timeString;
      bubbleDiv.appendChild(timeLabel);
      // 3-dot menu (user)
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

    // --------------- SENDING LOGIC ---------------
    $("send-btn").onclick = function () { sendMsg(); };
    $("input").addEventListener("keypress", function (e) { if (e.key === "Enter") sendMsg(); });
    function sendMsg(customText) {
      const input = $("input");
      const msg = (customText || input.value).trim();
      if (!msg) return;
      if (db && sessionId) {
        db.ref("chats/" + sessionId).push({
          sender: "user", message: msg, type: "text", timestamp: Date.now()
        });
        refreshPresenceOnActivity();
      }
      if (!customText) input.value = "";
    }

    // --------------- UPLOAD IMAGE LOGIC ---------------
    $("upload-btn").onclick = function () { $("imageUpload").click(); };
    $("imageUpload").onchange = function () { uploadImage(); };
    function uploadImage() {
      const fileInput = $("imageUpload");
      const file = fileInput.files[0];
      if (!file) return;
      const cloudName = "drrnur7f1";
      const uploadPreset = "chatbot_upload";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      fetch(url, { method: "POST", body: formData })
        .then(r => r.json())
        .then(data => {
          if (data.secure_url) {
            db.ref("chats/" + sessionId).push({
              sender: "user", message: data.secure_url, type: "image", timestamp: Date.now()
            });
          } else { alert("Upload failed."); }
        });
    }

    // --------------- EMOJI PICKER LOGIC ---------------
    $("emoji-btn").onclick = function () {
      const picker = $("emoji-picker");
      picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
    };
    $("emoji-picker").onclick = function (e) {
      const input = $("input");
      if (e.target.tagName === 'SPAN') {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + e.target.textContent + input.value.substring(end);
        input.focus();
        input.selectionStart = input.selectionEnd = start + e.target.textContent.length;
        $("emoji-picker").style.display = 'none';
      }
    };
    // Emoji List
    const emojis = ["😀","😂","😍","🥰","😎","😭","😡","😱","👍","🙏","🎉","🎂","🔥","🤔","🤖","❤️"];
    $("emoji-picker").innerHTML = emojis.map(e => `<span style="cursor:pointer;font-size:22px;padding:2px;">${e}</span>`).join('');
    document.addEventListener('click', function (e) {
      if (!$( "emoji-btn" ).contains(e.target) && !$( "emoji-picker" ).contains(e.target)) {
        $("emoji-picker").style.display = 'none';
      }
    });

    // --------------- TOGGLE BUTTON (OPEN/CLOSE WIDGET) ---------------
    $( "chatbot-toggle" ).onclick = function () {
    const chatContainer = $( "chat-container" );
    const isVisible = chatContainer.style.display === "flex";
    chatContainer.style.display = isVisible ? "none" : "flex";
      $( "chat-icon-img" ).style.display = isVisible ? "block" : "none";
      $( "close-icon-img" ).style.display = isVisible ? "none" : "block";
      setTimeout(() => {
        if ($( "name-prompt" ).style.display !== "none") $( "nameInput" ).focus();
        else if ($( "email-prompt" ).style.display !== "none") $( "emailInput" ).focus();
        else if ($( "chat" ).style.display !== "none") $( "input" ).focus();
      }, 100);
    };

    // --------------- TYPING INDICATOR (OPTIONAL: ADVANCED) ---------------
    function showTypingIndicator(who) {
      const el = $("typing-indicator");
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
    function hideTypingIndicator() {
      $("typing-indicator").style.display = "none";
    }

    // Error handling for unhandled promises
    window.addEventListener('unhandledrejection', function (event) {
      event.preventDefault();
    });
  }
})();

