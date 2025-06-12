// Firebase Configuration
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

// Initialize Firebase
let app, db, storage;
try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  storage = firebase.storage();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

document.addEventListener("DOMContentLoaded", function() {
  // Try to get saved name/email from localStorage
  let savedName = localStorage.getItem("einvite_user_name") || "";
  let savedEmail = localStorage.getItem("einvite_user_email") || "";

  if (document.getElementById("nameInput")) {
    document.getElementById("nameInput").value = savedName;
  }
  if (document.getElementById("emailInput")) {
    document.getElementById("emailInput").value = savedEmail;
  }
  // Always show name prompt first, and let the normal flow continue
  document.getElementById("name-prompt").style.display = "block";
  document.getElementById("email-prompt").style.display = "none";
  document.getElementById("location-prompt").style.display = "none";
  document.getElementById("chat").style.display = "none";
});




// Global Variables
let sessionId = "";
let userName = "";
let userEmail = "";
let userLocation = null;
let chatInitialized = false; 


let presenceTimers = { away: null, offline: null };

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

  // 2 min idle -> away
  presenceTimers.away = setTimeout(() => setPresence("away"), 2 * 60 * 1000);
  // 5 min idle -> offline
  presenceTimers.offline = setTimeout(() => setPresence("offline"), 5 * 60 * 1000);
}


// Preset Replies
const presetReplies = {
  "track my order": "📦 Sure! Please provide your order ID so I can check the delivery status.",
  "return product": "🔁 To return a product, go to your orders and click 'Return'. I can help you start the process.",
  "refund status": "💸 Refunds typically take 5–7 business days. Please share your order ID to check status.",
  "talk to agent": "👤 Please wait. Connecting you to a real support agent..."
};

let pendingBotReplyTimeout = null;

// Utility Functions
function generateSessionId(name) {
  const sanitized = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const timestamp = Date.now();
  return sanitized + "_" + timestamp;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}



// Create a clean key for Firebase paths from the email
function sanitizeEmail(email) {
    return email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}




function showError(message) {
  alert(message);
}

function showLoading(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    const button = element.querySelector('button');
    if (button) {
      button.disabled = true;
      button.textContent = message;
    }
  }
}

function hideLoading(elementId, originalText) {
  const element = document.getElementById(elementId);
  if (element) {
    const button = element.querySelector('button');
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

// Chat Functions
function startChat() {
  const nameInput = document.getElementById("nameInput");
  userName = nameInput.value.trim();

  if (userName === "") {
    showError("Please enter your name");
    nameInput.focus();
    return;
  }

  // Save to localStorage
  localStorage.setItem("einvite_user_name", userName);

  document.getElementById("name-prompt").style.display = "none";
  document.getElementById("email-prompt").style.display = "block";
  setTimeout(() => {
    document.getElementById("emailInput").focus();
  }, 100);
}

function submitEmail() {
  const emailInput = document.getElementById("emailInput");
  userEmail = emailInput.value.trim().toLowerCase();

  if (!userEmail || !validateEmail(userEmail)) {
    showError("Please enter a valid email address");
    emailInput.focus();
    return;
  }

  // Save to localStorage
  localStorage.setItem("einvite_user_email", userEmail);

  sessionId = sanitizeEmail(userEmail); // Continue as before...

  showLoading("email-prompt", "Saving...");


  // Save user data to Firebase with email-based sessionId
  if (db) {
    db.ref("users/" + sessionId).set({
      name: userName,
      email: userEmail,
      timestamp: Date.now()
    }).then(() => {
      hideLoading("email-prompt", "Submit Email");
      document.getElementById("email-prompt").style.display = "none";
      document.getElementById("location-prompt").style.display = "block";
    }).catch((error) => {
      console.error("Error saving user data:", error);
      hideLoading("email-prompt", "Submit Email");
      showError("Error saving data. Please try again.");
    });
  } else {
    hideLoading("email-prompt", "Submit Email");
    document.getElementById("email-prompt").style.display = "none";
    document.getElementById("location-prompt").style.display = "block";
  }
}


function getLocation() {
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
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now()
      };

      // Save location to Firebase under users path, NOT chats path
      if (db && sessionId) {
        db.ref("users/" + sessionId + "/location").set(userLocation).catch((error) => {
          console.error("Error saving location:", error);
        });
      }

status.textContent = "Location saved! Starting chat...";
hideLoading("location-prompt", "Share Location");

// Hide location prompt immediately and initialize chat
document.getElementById("location-prompt").style.display = "none";
setTimeout(initializeChat, 500);
    },
    (error) => {
      console.error("Geolocation error:", error);
      status.textContent = "Unable to retrieve your location.";
      hideLoading("location-prompt", "Share Location");
      setTimeout(skipLocation, 2000);
    },
    {
      timeout: 10000,
      enableHighAccuracy: false
    }
  );
}

function skipLocation() {
  listenForAgentTyping();
  document.getElementById("location-prompt").style.display = "none";
  initializeChat();
}

window.lastMessageDate = undefined;

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




function initializeChat() {
  if (chatInitialized) return;
  document.getElementById("chat").style.display = "flex";
  chatInitialized = true;

  const chatRef = db.ref("chats/" + sessionId);
  chatRef.once("value", (snapshot) => {
    if (!snapshot.exists()) {
      // Only push greeting if chat is empty
      db.ref("chats/" + sessionId).push({
        sender: "bot",
        message: `Hi ${userName}! 👋 How can I help you ?`,
        type: "text",
        timestamp: Date.now()
      }).then(() => {
        // Now load messages, greeting will be included
        loadChatMessages();
      });
      sessionStorage.setItem('greeted', 'true');
    } else {
      // Just load messages if chat exists
      loadChatMessages();
    }
  });

  refreshPresenceOnActivity();
  setupUserPresence();

  setTimeout(() => {
    document.getElementById("input").focus();
  }, 100);
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



function loadChatMessages(callback) {
  const chatRef = db.ref("chats/" + sessionId);
  const messagesContainer = document.getElementById("messages");
  messagesContainer.innerHTML = ""; // Clear chat

  window.lastMessageDate = undefined; // <-- RESET DATE SEPARATOR

  chatRef.off(); // Remove previous listeners

  // Track messages in a map for efficient DOM updates
  const messageElements = {};

  // Add message
  chatRef.on("child_added", (snapshot) => {
    const data = snapshot.val();
    if (data && data.message) {
      const msgDiv = createOrUpdateMessageElement(data, snapshot.key);
      messagesContainer.appendChild(msgDiv);
      messageElements[snapshot.key] = msgDiv;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  // Update message (edit)
  chatRef.on("child_changed", (snapshot) => {
    const data = snapshot.val();
    if (data && data.message) {
      if (!messageElements[snapshot.key]) {
        // Fallback: message not seen yet, add it
        const msgDiv = createOrUpdateMessageElement(data, snapshot.key, true);
        messagesContainer.appendChild(msgDiv);
        messageElements[snapshot.key] = msgDiv;
      } else {
        const msgDiv = createOrUpdateMessageElement(data, snapshot.key, true);
        messagesContainer.replaceChild(msgDiv, messageElements[snapshot.key]);
        messageElements[snapshot.key] = msgDiv;
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  // Remove message (delete)
  chatRef.on("child_removed", (snapshot) => {
    if (messageElements[snapshot.key]) {
      messageElements[snapshot.key].remove();
      delete messageElements[snapshot.key];
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  if (typeof callback === "function") callback();
}


// Helper to create/update message DOM
function createOrUpdateMessageElement(data, messageKey, isUpdate = false) {
  // Remove old date separators only if isUpdate is true, otherwise you may get date duplicates
  // (if you want ultra-clean logic, you may want to refactor date separators later)

  // For now, we'll just re-use your addMessage logic:
  const tempDiv = document.createElement('div');
  addMessage(data.message, data.sender, null, data.timestamp, messageKey, tempDiv);
  return tempDiv.firstChild; // addMessage appends to container, so use first child
}






// Add optional container argument
function addMessage(text, sender, name, timestamp = Date.now(), messageKey = null, container = null) {
  const messagesContainer = container || document.getElementById("messages");

  // DATE and TIME
  const now = new Date(timestamp);
  const dayString = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  // ---- DATE SEPARATOR LOGIC ----
  if (window.lastMessageDate !== dayString) {
    const dateLine = document.createElement("div");
    dateLine.className = "timestamp-line";
    dateLine.textContent = dayString;
    messagesContainer.appendChild(dateLine);
    window.lastMessageDate = dayString;
  }

  // MESSAGE CONTAINER
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  if (messageKey) msgDiv.dataset.key = messageKey; // For deletion
  // --- Only for bot/agent: Header with avatar and name
  if (sender === "bot" || sender === "agent") {
    const headerDiv = document.createElement("div");
    headerDiv.className = "msg-header";

    const avatarDiv = document.createElement("div");
    avatarDiv.className = "avatar";
    let avatarSrc = "";
    if (sender === "bot") avatarSrc = "images/logo.jpg";
    else avatarSrc = "images/logo.jpg";
    avatarDiv.innerHTML = `<img src="${avatarSrc}" alt="${sender}" />`;

    const nameSpan = document.createElement("span");
    nameSpan.className = "sender-name";
    nameSpan.textContent = name || (sender === "bot" ? "E Inviter" : "Admin");
    headerDiv.appendChild(avatarDiv);
    headerDiv.appendChild(nameSpan);

    msgDiv.appendChild(headerDiv);
  }

  // --- Message bubble
  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";

  // Message text or image
  const msgContent = document.createElement("div");
  if (
    typeof text === 'string' &&
    (text.match(/\.(jpeg|jpg|gif|png|webp)$/i) || text.startsWith("data:image/"))
  ) {
    const img = document.createElement('img');
    img.src = text;
    img.alt = "Sent image";
    img.style.maxWidth = "200px";
    img.style.maxHeight = "150px";
    img.style.borderRadius = "8px";
    msgContent.appendChild(img);
  } else {
    msgContent.textContent = text;
  }
  bubbleDiv.appendChild(msgContent);

  // --- Time label inside bubble (bottom right) ---
  const timeLabel = document.createElement("span");
  timeLabel.className = "msg-time";
  timeLabel.textContent = timeString;
  bubbleDiv.appendChild(timeLabel);

  // --- 3-dot menu for user's own messages ---
if (sender === "user" && messageKey) {
  const msgActions = document.createElement("div");
  msgActions.className = "msg-actions";

  // 3-dot menu button
  const menuBtn = document.createElement("button");
  menuBtn.className = "msg-menu";
  menuBtn.innerHTML = "&#8942;";

  // Dropdown menu
  const dropdown = document.createElement("div");
  dropdown.className = "msg-dropdown";
  dropdown.style.display = "none";
  dropdown.innerHTML = `
    <div class="msg-dropdown-item" data-action="edit">Edit</div>
    <div class="msg-dropdown-item" data-action="delete">Delete</div>
    <div class="msg-dropdown-item" data-action="copy">Copy</div>
  `;

  // Toggle dropdown (show/hide)
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    // First, close all open dropdowns
    document.querySelectorAll('.msg-dropdown').forEach(el => el.style.display = "none");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  };

  // Click outside to close any dropdown
  document.addEventListener("click", (event) => {
    if (!msgActions.contains(event.target)) {
      dropdown.style.display = "none";
    }
  });

  // Handle dropdown actions
  dropdown.addEventListener("click", function(e) {
    if (!e.target.classList.contains("msg-dropdown-item")) return;
    dropdown.style.display = "none";
    const action = e.target.dataset.action;
    if (action === "edit") {
      editMessageFromFirebase(messageKey, msgContent, bubbleDiv);
    } else if (action === "delete") {
      deleteMessageFromFirebase(messageKey);
    } else if (action === "copy") {
      copyMessageToClipboard(msgContent);
    }
  });

  msgActions.appendChild(menuBtn);  
  msgActions.appendChild(dropdown);
  bubbleDiv.appendChild(msgActions);
}



  msgDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Edit message (user’s own)
function editMessageFromFirebase(messageKey, msgContent, bubbleDiv) {
  // Show a prompt with current text
  const currentText = msgContent.textContent || "";
  const newText = prompt("Edit your message:", currentText);
  if (newText !== null && newText.trim() !== "" && newText !== currentText) {
    db.ref("chats/" + sessionId + "/" + messageKey).update({
      message: newText,
      edited: true
    }).then(() => {
      // Update in UI right away (optional, will update anyway from realtime DB)
      msgContent.textContent = newText;
    });
  }
}

// Delete message (already present, leave unchanged)
function deleteMessageFromFirebase(messageKey) {
  if (!sessionId || !messageKey) return;
  if (confirm("Are you sure you want to delete this message for everyone?")) {
    db.ref("chats/" + sessionId + "/" + messageKey).remove().then(() => {
      // Remove from UI
      const msgDiv = document.querySelector(`[data-key="${messageKey}"]`);
      if (msgDiv) msgDiv.remove();
    });
  }
}

// Copy message
function copyMessageToClipboard(msgContent) {
  const text = typeof msgContent === "string" ? msgContent : msgContent.textContent;
  navigator.clipboard.writeText(text).then(() => {
    // Optionally show a toast
    // alert("Copied to clipboard!");
  });
}


function deleteMessageFromFirebase(messageKey) {
  if (!sessionId || !messageKey) return;
  if (confirm("Are you sure you want to delete this message for everyone?")) {
    db.ref("chats/" + sessionId + "/" + messageKey).remove().then(() => {
      // Remove from UI
      const msgDiv = document.querySelector(`[data-key="${messageKey}"]`);
      if (msgDiv) msgDiv.remove();
    });
  }
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


function addImageMessage(url, sender) {
  addMessage(url, sender);
}

function botMessage(text) {
  if (db && sessionId) {
    db.ref("chats/" + sessionId).push({
      sender: "bot",
      message: text,
      type: "text",
      timestamp: Date.now()
    });
  }
  // Don’t call addMessage() here!
}


function sendMsg(customText) {
  const input = document.getElementById("input");
  const msg = (customText || input.value).trim();
  if (!msg) return;
  if (db && sessionId) {
    db.ref("chats/" + sessionId).push({
      sender: "user",
      message: msg,
      type: "text",
      timestamp: Date.now()
    });
    refreshPresenceOnActivity(); // <-- ADD THIS
  }
  if (!customText) input.value = "";
}








function presetClick(message) {
  sendMsg(message);
}

function uploadImage() {
  const fileInput = document.getElementById("imageUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select an image.");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  fetch("upload.php", {
    method: "POST",
    body: formData
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.success) {
        // Just push to Firebase or wherever you need:
        db.ref("chats/" + sessionId).push({
          sender: "user",
          message: data.url,   // <-- this will be "/uploads/xxxx.jpg"
          type: "image",
          timestamp: Date.now()
        });
        refreshPresenceOnActivity();
      } else {
        alert("Upload failed: " + data.error);
      }
    })
    .catch((error) => {
      console.error("Error uploading image:", error);
      alert("An error occurred.");
    });
}




// Event Listeners
document.addEventListener("DOMContentLoaded", function() {
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatContainer = document.getElementById("chat-container");
  const chatIcon = document.getElementById("chat-icon-img");
  const closeIcon = document.getElementById("close-icon-img");

  chatbotToggle.onclick = () => {
    const isVisible = chatContainer.style.display === "flex";
    chatContainer.style.display = isVisible ? "none" : "flex";
    
    // Toggle the icons
    if (!isVisible) {
      chatIcon.style.display = "none";
      closeIcon.style.display = "block";
    } else {
      chatIcon.style.display = "block";
      closeIcon.style.display = "none";
    }

    // Focus on appropriate input when opening
    if (!isVisible) {
      setTimeout(() => {
        if (document.getElementById("name-prompt").style.display !== "none") {
          document.getElementById("nameInput").focus();
        } else if (document.getElementById("email-prompt").style.display !== "none") {
          document.getElementById("emailInput").focus();
        } else if (document.getElementById("chat").style.display !== "none") {
          document.getElementById("input").focus();
        }
      }, 100);
    }
  };

  // Enter key support for inputs
  document.getElementById("nameInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      startChat();
    }
  });

  document.getElementById("emailInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      submitEmail();
    }
  });

  document.getElementById("input").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMsg();
    }
  });

  // Error handling for unhandled promises
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });
});


document.addEventListener("DOMContentLoaded", function() {
  const emojiBtn = document.getElementById('emoji-btn');
  const input = document.getElementById('input');
  const picker = document.getElementById('emoji-picker');

  let typingTimeout;
function setTyping(isTyping) {
  if (!db || !sessionId) return;
  db.ref("typing/" + sessionId + "/user").set(isTyping);
}
input.addEventListener("input", () => {
  refreshPresenceOnActivity();
  setTyping(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => setTyping(false), 1200);
});
input.addEventListener("blur", () => setTyping(false));


  // Basic emoji list (you can add many more!)
  const emojis = ["😀","😂","😍","🥰","😎","😭","😡","😱","👍","🙏","🎉","🎂","🔥","🤔","🤖","❤️"];
  picker.innerHTML = emojis.map(e => `<span style="cursor:pointer;font-size:22px;padding:2px;">${e}</span>`).join('');

  emojiBtn.addEventListener('click', function() {
    picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
  });

  picker.addEventListener('click', function(e) {
    if (e.target.tagName === 'SPAN') {
      // Insert at caret position
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = input.value.substring(0, start) + e.target.textContent + input.value.substring(end);
      input.focus();
      input.selectionStart = input.selectionEnd = start + e.target.textContent.length;
      picker.style.display = 'none';
    }
  });

  // Optional: close on click outside
  document.addEventListener('click', function(e) {
    if (!emojiBtn.contains(e.target) && !picker.contains(e.target)) {
      picker.style.display = 'none';
    }
  });
});

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

function hideTypingIndicator() {
  document.getElementById("typing-indicator").style.display = "none";
}