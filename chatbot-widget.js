(function () {
  // ---- CONFIGURATION ----
  const IMAGES = {
    logo: '/code/chatbot/images/logo.jpg',
    chatIcon: '/code/chatbot/images/chat-icon.png',
    closeIcon: '/code/chatbot/images/close-icon.png',
    crispMsg: '/code/chatbot/images/crsip-msg.png'
  };
  const CSS_URL = '/code/chatbot/chatbot-widget.css';

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
    <!-- PROMPT: Name -->
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
        <button id="start-btn" class="next-btn" >Next</button>
      </div>
    </div>

    <!-- PROMPT: Email -->
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
        <button id="email-btn" class="email-btn">Submit Email</button>
      </div>
    </div>

    <!-- PROMPT: Location -->
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
        <button id="location-btn" class="location-btn" >Share Location</button>
        <button id="skip-location-btn" class="skip-location-btn" style="background: #6b7280;">Skip for Now</button>
        <p id="location-status"></p>
      </div>
    </div>

    <!-- === THE ONLY CHAT AREA === -->
    <div id="chat" class="chat-bot-bg" style="display:none;">
      <!-- Chat Header -->
      <div class="chat-header">
      <button id="chatbot-close-floating" title="Close Chat">&times;</button>
        <div class="chat-header-top">
          <button class="crisp-chat-btn">
            <span class="chat-icon-circle">
              <img src="${IMAGES.crispMsg}" alt="Chat Icon" class="chat-icon" />
            </span>
            <span class="chat-btn-label">Chat</span>
          </button>
        </div>
        
        <div class="chat-header-main">
          <div class="header-avatar-row">
            <div class="overlap-logos">
              <img src="${IMAGES.logo}" class="overlap-avatar" />
              <span class="overlap-chat-icon">
                <img src="${IMAGES.crispMsg}" alt="Chat Icon" class="chat-icon" />
              </span>
            </div>
          </div>
          <div class="header-title">Questions? Chat with us!</div>
          <div class="header-status-row">
            <span class="online-dot"></span>
            <span class="header-status-msg">Typically replies under an hour</span>
          </div>
        </div>
      </div>
      <!-- Messages Area -->
      <div id="messages" class="chat-messages"></div>
      <!-- Typing Indicator -->
      <div id="typing-indicator" style="display:none;margin:6px 0 0 16px;"></div>
      <!-- Input Area -->
      <div class="input-wrapper">
        <div class="input-row">
          <input id="input" type="text" placeholder="Type your message..." />
        <div class="input-actions">
          <input type="file" id="imageUpload" accept="image/*" style="display:none;">
          <button id="upload-btn" class="text-bnt"><svg class="chat-svg" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="currentColor" d="M10.546 4.363v7.563c0 1.215-.822 2.32-2.011 2.564A2.55 2.55 0 015.455 12V2.99c0-.723.493-1.397 1.208-1.515.91-.151 1.7.55 1.7 1.434v7.636a.364.364 0 01-.727 0V4.363a.728.728 0 00-1.454 0v6.075c0 .952.683 1.82 1.629 1.916a1.82 1.82 0 002.007-1.809V3.038C9.818 1.52 8.711.161 7.2.014A2.912 2.912 0 004 2.91v8.913c0 2.088 1.522 3.955 3.6 4.158A4.005 4.005 0 0012 12V4.363a.728.728 0 00-1.454 0z"/></svg></button>


          <button id="emoji-btn" class="text-bnt" type="button"><svg class="chat-svg" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="currentColor" d="M7.992 0C3.576 0 0 3.584 0 8s3.576 8 7.992 8C12.416 16 16 12.416 16 8s-3.584-8-8.008-8zM8 14.4A6.398 6.398 0 011.6 8c0-3.536 2.864-6.4 6.4-6.4 3.536 0 6.4 2.864 6.4 6.4 0 3.536-2.864 6.4-6.4 6.4zm2.8-7.2c.664 0 1.2-.536 1.2-1.2 0-.664-.536-1.2-1.2-1.2S9.6 5.336 9.6 6c0 .664.536 1.2 1.2 1.2zm-5.6 0c.664 0 1.2-.536 1.2-1.2 0-.664-.536-1.2-1.2-1.2S4 5.336 4 6c0 .664.536 1.2 1.2 1.2zM8 12.4a4.375 4.375 0 003.456-1.692c.378-.485-.033-1.108-.648-1.108H5.192c-.615 0-1.026.623-.648 1.108A4.375 4.375 0 008 12.4z"/></svg></button>

          
          <button id="send-btn" class="text-bnt" onclick="sendMsg()" title="Send Message" ><svg class="chat-svg" xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><clipPath id="a"><path fill="currentColor" d="M14.84.054a.864.864 0 011.107 1.107l-5.189 14.27a.864.864 0 01-1.423.316L6.15 12.56a.864.864 0 01-.056-1.16l7.03-8.522L4.6 9.908a.864.864 0 01-1.16-.056L.252 6.666A.864.864 0 01.57 5.243z"/></clipPath><g clip-path="url(#a)" transform="rotate(45 6.516 4.341)"><path d="M0 0h16v16H0z"/></g></svg></button>
          <div id="emoji-picker" style="width: 300px;display:none;position:absolute;bottom:100px;left:30px;z-index:1000;background:#fff;padding:1px 5px;border:1px solid #ddd;border-radius:10px;box-shadow: inset rgb(0 0 0 / 12%) 0px 0px 20px;"></div>
        </div>
        </div>
      </div>
      <!-- Image Preview Area (hidden by default) -->
      <div id="image-preview-area" style="display:none;flex-direction:column;align-items:flex-end;margin-top:8px;">
        <img id="image-preview" src="" alt="Preview" style="max-width:180px;max-height:160px;border-radius:10px;border:1px solid #e4e4e4;background:#fff;margin-bottom:8px;">
        <div style="display:flex;gap:8px;">
          <button id="image-cancel-btn" class="text-bnt" style="background:#fff;color:#222; font-size:13px; background-color: #ebebeb; ">Cancel</button>
          <button id="image-send-btn" class="next-btn" style="background:#2563eb;">Send</button>
        </div>
      </div>
    </div>
    <!-- === END CHAT AREA === -->
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


    if (!document.getElementById('chatbot-fullscreen-image-overlay')) {
  const overlay = document.createElement('div');
  overlay.id = 'chatbot-fullscreen-image-overlay';
  overlay.style = `
    display:none; position:fixed; left:0;top:0;width:100vw;height:100vh;z-index:2147483647;
    background:rgba(15,20,40,0.92); justify-content:center;align-items:center;cursor:zoom-out;
  `;
  overlay.innerHTML = `<img src="" style="max-width:96vw;max-height:96vh;border-radius:16px;box-shadow:0 6px 64px #000a;background:#fff;">`;
  document.body.appendChild(overlay);
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      overlay.querySelector('img').src = '';
    }
  };
}


    // 👇 SET THIS VALUE PER WEBSITE! (for prod, use build variable/env or inline change)
    const WEBSITE_KEY = window.WEBSITE_KEY || "einvite"; // Set this PER SITE in the embedding page

    function chatRef(sessionId) {
      return db.ref("chats/" + WEBSITE_KEY + "/" + sessionId);
    }
    function userRef(sessionId) {
      return db.ref("users/" + WEBSITE_KEY + "/" + sessionId);
    }
    function statusRef(sessionId) {
      return db.ref("status/" + WEBSITE_KEY + "/" + sessionId);
    }



    window.skipLocation = skipLocation;

    // Call this on any user interaction (mousemove, keydown, click, etc.)
    // Presence update function (keep!)
    function setPresence(state) {
      if (!sessionId) return;
      db.ref('status/' + sessionId).set({
        state, last_changed: firebase.database.ServerValue.TIMESTAMP
      });
    }

    let idleTimer = null;

    function markOnline() {
      setPresence("online");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setPresence("away"), 3 * 60 * 1000); // 3 minutes
    }

    function markOffline() {
      setPresence("offline");
      clearTimeout(idleTimer);
    }

    ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
      window.addEventListener(evt, markOnline);
    });

    window.addEventListener('focus', markOnline);
    window.addEventListener('blur', markOffline);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        markOffline();
      } else {
        markOnline();
      }
    });

    window.addEventListener('beforeunload', markOffline);

    function initPresenceTracking() {
      // Event listeners for presence (same as before)
      ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
        window.addEventListener(evt, markOnline);
      });
      window.addEventListener('focus', markOnline);
      window.addEventListener('blur', markOffline);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) markOffline();
        else markOnline();
      });
      window.addEventListener('beforeunload', markOffline);

      // Set presence online initially
      markOnline();
    }


    // GLOBALS
    let sessionId = "", userName = "", userEmail = "", userLocation = null, chatInitialized = false;
    let windowLastMessageDate = undefined;

    function sanitizeEmail(email) {
      return email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    function updateSessionIdFromStorage() {
      const email = localStorage.getItem("chatbot_user_email") || "";
      sessionId = email ? sanitizeEmail(email) : "";
    }

    function showChat() {
      document.getElementById("chat").style.display = "flex";
      document.getElementById("chat").classList.add("chat-active");
      // Hide all prompts
      document.getElementById("name-prompt").style.display = "none";
      document.getElementById("email-prompt").style.display = "none";
      document.getElementById("location-prompt").style.display = "none";
      // Show chat input
      document.getElementById("chat-input-area").style.display = "flex";
    }

    function showPrompt() {
      document.getElementById("chat").classList.remove("chat-active");
      document.getElementById("chat-input-area").style.display = "none";
    }


    function bootstrapChat() {
      updateSessionIdFromStorage();
      let savedEmail = localStorage.getItem("chatbot_user_email");
      let savedName = localStorage.getItem("chatbot_user_name");

      if (savedEmail) {
        // Try to fetch name from Firebase
        userRef(sanitizeEmail(savedEmail)).once('value', function (snapshot) {
          if (snapshot.exists() && snapshot.val().name) {
            savedName = snapshot.val().name;
            localStorage.setItem('chatbot_user_name', savedName); // cache for next time on this device
            // skip prompts, open chat
            userName = savedName;
            userEmail = savedEmail;
            document.getElementById("name-prompt").style.display = "none";
            document.getElementById("email-prompt").style.display = "none";
            document.getElementById("location-prompt").style.display = "none";
            document.getElementById("chat").style.display = "flex";
            chatInitialized = true;
            loadChatMessages();
          } else {
            // Show name prompt (for new user, or first device)
            document.getElementById("name-prompt").style.display = "block";
            document.getElementById("email-prompt").style.display = "none";
            document.getElementById("location-prompt").style.display = "none";
            document.getElementById("chat").style.display = "none";
          }
        });
      } else {
        // Show email prompt
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
    document.getElementById("start-btn").onclick = function () {
      userName = document.getElementById("nameInput").value.trim();
      if (!userName) { showError("Please enter your name"); document.getElementById("nameInput").focus(); return; }
      localStorage.setItem("chatbot_user_name", userName);
      document.getElementById("name-prompt").style.display = "none";
      document.getElementById("email-prompt").style.display = "block";
      setTimeout(() => document.getElementById("emailInput").focus(), 100);
    };

    document.getElementById("nameInput").addEventListener("keypress", function (e) {
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
      userRef(sessionId).set({
        name: userName, email: userEmail, timestamp: Date.now()
      }).then(() => {
        hideLoading("email-prompt", "Submit Email");
        document.getElementById("email-prompt").style.display = "none";
        document.getElementById("location-prompt").style.display = "block";
        loadChatMessages(); // <--- NOW ADDED**
      }).catch(() => {
        hideLoading("email-prompt", "Submit Email");
        showError("Error saving data. Please try again.");
      });
    };

    document.getElementById("emailInput").addEventListener("keypress", function (e) {
      if (e.key === "Enter") document.getElementById("email-btn").click();
    });


    // LOCATION PROMPT
    document.getElementById("location-btn").onclick = function () {
      const status = document.getElementById("location-status");
      if (!navigator.geolocation) {
        status.textContent = "No Users Location";
        setTimeout(skipLocation, 2000);
        return;
      }
      status.textContent = "Getting location...";
      showLoading("location-prompt", "Getting Location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude, timestamp: Date.now() };
          db.ref('users/' + WEBSITE_KEY + '/' + sessionId + '/location').set(userLocation).catch(() => { });
          status.textContent = "Location Saved! Starting chat...";
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



    // INITIALIZE CHAT
    function initializeChat() {
      if (chatInitialized) return;
      document.getElementById("chat").style.display = "flex";
      chatInitialized = true;
      const chatRefInstance = chatRef(sessionId);
      chatRefInstance.once("value", (snapshot) => {
        if (!snapshot.exists()) {
          const greetingMsg = {
            sender: "bot",
            message: `Hi ${userName}! 👋 How can I help you ?`,
            type: "text",
            timestamp: Date.now()
          };
          chatRef(sessionId).push(greetingMsg).then(() => { loadChatMessages(); });
          sessionStorage.setItem('greeted', 'true');
        } else {
          console.log("sessionId used for chat:", sessionId);
          console.log("Checking if chat exists at /chats/" + sessionId);
          loadChatMessages();
        }
      });
      initPresenceTracking();
      setTimeout(() => { document.getElementById("input").focus(); }, 100);
    }



    function sendMessage(message, type = "text") {
      if (!db || !sessionId || !message) return;
      const newMsgRef = chatRef(sessionId).push();
      newMsgRef.set({
        message,
        sender: "user",
        type,
        timestamp: Date.now()
      }).then(() => {
        addMessage(message, "user", userName, Date.now(), newMsgRef.key);
      });
    }

    function updateMessageStatusUI(msgId, msgData) {
      const msgDiv = document.querySelector(`[data-key="${msgId}"]`);
      if (!msgDiv) return;
      const timeLabel = msgDiv.querySelector('.msg-time');
      if (!timeLabel) return;
      // Only update ticks for user messages
      if ((msgData.sender || '').toLowerCase() === 'user') {
        let icon = '';
        if (msgData.status === "read") icon = "✔✔";
        else if (msgData.status === "delivered") icon = "✔✔";
        else icon = "✔";
        timeLabel.innerHTML = timeLabel.textContent.split(' ')[0] +
          ` <span style="color:${msgData.status === "read" ? "#2563eb" : "#bababa"};">${icon}</span>`;
      }
    }

    function markAllAdminMessagesAsRead(sessionId) {
  chatRef(sessionId).once("value", function(snapshot) {
    const messages = snapshot.val() || {};
    Object.entries(messages).forEach(([msgId, msg]) => {
      const sender = (msg.sender || "").toLowerCase();
      if (
        (sender === "admin" || sender === "bot" || sender === "agent") &&
        msg.status !== "read"
      ) {
        chatRef(sessionId).child(msgId).update({ status: "read" });
      }
    });
  });
}



    // LOAD & RENDER MESSAGES
    function loadChatMessages(callback) {
      updateSessionIdFromStorage();
      if (!sessionId) return;
      const chatRefInstance = chatRef(sessionId);
      const messagesContainer = document.getElementById("messages");
      markAllAdminMessagesAsRead(sessionId);
      messagesContainer.innerHTML = "";
      windowLastMessageDate = undefined;
      chatRefInstance.off();
      const messageElements = {};
      chatRefInstance.on("child_added", (snapshot) => {
        const data = snapshot.val();
        const msgDiv = addMessage(data.message, data.sender, null, data.timestamp, snapshot.key);

        if (msgDiv) {
          messageElements[snapshot.key] = msgDiv;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
      chatRefInstance.on("child_changed", (snapshot) => {
        const updatedMsg = snapshot.val();
        const msgId = snapshot.key;
        updateMessageStatusUI(msgId, updatedMsg);
      });

      chatRefInstance.on("child_removed", (snapshot) => {
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
  if (!messagesContainer) {
    console.error("No messages container found to append message to.");
    return;
  }
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
      const isImageMsg = typeof text === 'string' && (text.match(/\.(jpeg|jpg|gif|png|webp)$/i) || text.startsWith("data:image/"));
      let bubbleDiv, msgContent;

      if (isImageMsg) {
   bubbleDiv = document.createElement("div");
        bubbleDiv.className = "bubble image-bubble"; // special class for image messages
        bubbleDiv.style.background = "transparent";
        bubbleDiv.style.boxShadow = "none";
        bubbleDiv.style.padding = "0";
        bubbleDiv.style.marginLeft = "0";
        bubbleDiv.style.display = "flex";
        bubbleDiv.style.flexDirection = "column";
        msgContent = document.createElement("img");
        msgContent.src = text.startsWith('/') ? window.location.origin + text : text;
        msgContent.alt = "Sent image";
        msgContent.style.cursor = "zoom-in";
        msgContent.onclick = function() {
        const overlay = document.getElementById('chatbot-fullscreen-image-overlay');
        overlay.querySelector('img').src = this.src;
        overlay.style.display = 'flex';
      };

        msgContent.style.maxWidth = "200px";
        msgContent.style.maxHeight = "200px";
        msgContent.style.borderRadius = "10px";
        msgContent.style.display = "block";
        msgContent.style.background = "#fff";
        msgContent.style.margin = "1px 0 10px 50px";
        msgContent.style.border = "1px solid #e4e4e4";
        bubbleDiv.appendChild(msgContent);
      } else {
        bubbleDiv = document.createElement("div");
        bubbleDiv.className = "bubble";
        msgContent = document.createElement("div");
        msgContent.textContent = text;
        bubbleDiv.appendChild(msgContent);
      }


      const timeLabel = document.createElement("span");
      timeLabel.className = "msg-time";
      timeLabel.textContent = timeString;

      // Add tick icon if this is a user message (your own sent), and status exists
      if (sender === "user" && messageKey) {
        // Get status field from Firebase for this message
        chatRef(sessionId).child(messageKey)
          .once("value", (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.status) return;
            let icon = "";
            if (data.status === "read") icon = "✔✔"; // double blue tick (style via CSS)
            else if (data.status === "delivered") icon = "✔✔"; // double gray tick
            else icon = "✔"; // single tick
            // You can use emoji or SVG here
            timeLabel.innerHTML += ` <span style="color:${data.status === "read" ? "#2563eb" : "#bababa"};">${icon}</span>`;
          });
      }
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
        dropdown.addEventListener("click", function (e) {
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


    document.querySelectorAll('.chatbot-chat-img').forEach(img => {
  img.style.cursor = "zoom-in";
  img.onclick = function() {
    const overlay = document.getElementById('chatbot-fullscreen-image-overlay');
    overlay.querySelector('img').src = this.src;
    overlay.style.display = 'flex';
  };
});



    function editMessageFromFirebase(messageKey, msgContent, bubbleDiv) {
      const currentText = msgContent.textContent || "";
      const newText = prompt("Edit your message:", currentText);
      if (newText !== null && newText.trim() !== "" && newText !== currentText) {
        chatRef(sessionId).child(messageKey)
          .update({
            message: newText, edited: true
          }).then(() => { msgContent.textContent = newText; });
      }
    }
    function deleteMessageFromFirebase(messageKey) {
      if (!sessionId || !messageKey) return;
      if (confirm("Are you sure you want to delete this message for everyone?")) {
        chatRef(sessionId).child(messageKey)
          .remove().then(() => {
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
      chatRef(sessionId).push({
        sender: "user", message: msg, type: "text", timestamp: Date.now(), status: "sent"
      });

      if (!customText) input.value = "";
    }


    function addImageMessage(url, sender) {
      addMessage(url, sender);
    }

    function presetClick(message) {
      sendMsg(message);
    }
    // UPLOAD IMAGE
    // Select DOM nodes
    const imageInput = document.getElementById("imageUpload");
    const imagePreviewArea = document.getElementById("image-preview-area");
    const imagePreview = document.getElementById("image-preview");
    const imageCancelBtn = document.getElementById("image-cancel-btn");
    const imageSendBtn = document.getElementById("image-send-btn");

    // 1. When user clicks upload button, open the file picker
    document.getElementById("upload-btn").onclick = function () {
      imageInput.value = ""; // Clear previous
      imageInput.click();
    };

    // 2. When a file is selected, show preview UI (don't upload yet!)
    imageInput.onchange = function () {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreviewArea.style.display = "flex";
        // Optionally hide chat input while image preview is visible
        document.getElementById("input").disabled = true;
        document.getElementById("send-btn").disabled = true;
      };
      reader.readAsDataURL(file);
    };

    // 3. Cancel button: close preview, restore normal UI
    imageCancelBtn.onclick = function () {
      imagePreviewArea.style.display = "none";
      imagePreview.src = "";
      imageInput.value = "";
      document.getElementById("input").disabled = false;
      document.getElementById("send-btn").disabled = false;
    };

    // 4. Send button: upload to Cloudinary and send to chat
    imageSendBtn.onclick = function () {
      const file = imageInput.files[0];
      if (!file) return;
      imageSendBtn.disabled = true;
      imageSendBtn.textContent = "Uploading...";
      // Cloudinary upload (reuse your existing logic)
      const cloudName = "drrnur7f1";
      const uploadPreset = "einvite_upload";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      fetch(url, { method: "POST", body: formData })
        .then(r => r.json())
        .then(data => {
          if (data.secure_url) {
            // Send as chat message
            chatRef(sessionId).push({
              sender: "user",
              message: data.secure_url,
              type: "image",
              timestamp: Date.now()
            });
            // Reset preview and UI
            imagePreviewArea.style.display = "none";
            imagePreview.src = "";
            imageInput.value = "";
            imageSendBtn.disabled = false;
            imageSendBtn.textContent = "Send";
            document.getElementById("input").disabled = false;
            document.getElementById("send-btn").disabled = false;
          } else {
            alert("Upload failed.");
            imageSendBtn.disabled = false;
            imageSendBtn.textContent = "Send";
          }
        })
        .catch(() => {
          alert("Upload error.");
          imageSendBtn.disabled = false;
          imageSendBtn.textContent = "Send";
        });
    };


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
    const emojis = ["😀", "😂", "😍", "🥰", "😎", "😭", "😡", "😱", "👍", "🙏", "🎉", "🎂", "🔥", "🤔", "🤖", "❤️"];
    document.getElementById("emoji-picker").innerHTML = emojis.map(e => `<span style="cursor:pointer;font-size:20px;padding:2px;">${e}</span>`).join('');
    document.addEventListener('click', function (e) {
      if (!document.getElementById("emoji-btn").contains(e.target) && !document.getElementById("emoji-picker").contains(e.target)) {
        document.getElementById("emoji-picker").style.display = 'none';
      }
    });

    // TOGGLE BUTTON
const chatContainer = document.getElementById('chat-container');
const closeBtn = document.getElementById('chatbot-close-floating');
const toggleBtn = document.getElementById('chatbot-toggle');

// Helper to detect mobile or zoomed-in fullscreen mode
function isMobileView() {
  // true if mobile or fullscreen at zoom
  return window.innerWidth <= 450 || window.innerHeight <= 600 || chatContainer.classList.contains('fullscreen-at-zoom');
}

function updateButtonsOnChatToggle() {
  const chatOpen = chatContainer.style.display === "flex";
  if (isMobileView()) {
    closeBtn.style.display = chatOpen ? "block" : "none";   // Show cross only if chat open
    toggleBtn.style.display = chatOpen ? "none" : "flex";   // Show toggle only if chat closed
  } else {
    closeBtn.style.display = "none";                        // Hide cross always
    toggleBtn.style.display = "flex";                       // Show toggle always
  }
}

toggleBtn.onclick = function () {
  const chatOpen = chatContainer.style.display === "flex";
  chatContainer.style.display = chatOpen ? "none" : "flex";
  updateButtonsOnChatToggle();
  // focus logic...
};

closeBtn.onclick = function () {
  chatContainer.style.display = "none";
  updateButtonsOnChatToggle();
};

window.addEventListener("resize", updateButtonsOnChatToggle);
window.addEventListener("orientationchange", updateButtonsOnChatToggle);
window.addEventListener('DOMContentLoaded', updateButtonsOnChatToggle);
setTimeout(updateButtonsOnChatToggle, 800);

function setChatbotZoomClass() {
  var zoom = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
  var chatbot = document.getElementById('chat-container');
  if (!chatbot) return;
  if (zoom >= 1.1) {
    chatbot.classList.add('fullscreen-at-zoom');
  } else {
    chatbot.classList.remove('fullscreen-at-zoom');
  }
  updateButtonsOnChatToggle(); // Ensure correct button after zoom
}
window.addEventListener('resize', setChatbotZoomClass);
window.addEventListener('DOMContentLoaded', setChatbotZoomClass);
setTimeout(setChatbotZoomClass, 800);


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
      db.ref('typing/' + WEBSITE_KEY + '/' + sessionId + '/user').set(true / false);
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

  // // --- [THEME AUTO-DETECT & APPLY] ---
  // // --- [AUTO-DETECT HOST SITE COLORS] ---
  // window.addEventListener("DOMContentLoaded", function () {
  //   // 1. Try to detect main color from most common real site elements
  //   let primary =
  //     getComputedStyle(document.querySelector('a'))?.color ||
  //     getComputedStyle(document.querySelector('button'))?.backgroundColor ||
  //     getComputedStyle(document.body).color ||
  //     "#1877f2"; // Fallback blue

  //   let background =
  //     getComputedStyle(document.body).backgroundColor ||
  //     "#ffffff"; // Fallback white

  //   // 2. Find the chatbot container
  //   var chatRoot = document.getElementById('chat-container');
  //   if (chatRoot) {
  //     // 3. Set theme for chatbot only
  //     chatRoot.style.setProperty('--primary', primary);
  //     chatRoot.style.setProperty('--background', background);
  //   }
  // });

  function setChatbotZoomClass() {
    // Ratio of outerWidth to innerWidth increases with zoom
    var zoom = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
    var chatbot = document.getElementById('chat-container');
    if (!chatbot) return;
    if (zoom >= 1.1) { // Triggers above 100% zoom (110% and more)
      chatbot.classList.add('fullscreen-at-zoom');
    } else {
      chatbot.classList.remove('fullscreen-at-zoom');
    }
  }
  window.addEventListener('resize', setChatbotZoomClass);
  window.addEventListener('DOMContentLoaded', setChatbotZoomClass);
  // For widgets loaded dynamically, you may want:
  setTimeout(setChatbotZoomClass, 800);

})();