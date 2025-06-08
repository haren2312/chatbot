

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

// Global Variables
let sessionId = "";
let userName = "";
let userEmail = "";
let userLocation = null;
let chatInitialized = false;

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
function sanitizeEmail(email) {
    return email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}
// After email input/validation:
userEmail = emailInput.value.trim().toLowerCase();
sessionId = sanitizeEmail(userEmail);

  
  // Hide name prompt, show email prompt
  document.getElementById("name-prompt").style.display = "none";
  document.getElementById("email-prompt").style.display = "block";
  
  // Focus on email input
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

  // The magic: generate sessionId from email
  sessionId = sanitizeEmail(userEmail); // "raj09_gmail_com"

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
  document.getElementById("location-prompt").style.display = "none";
  initializeChat();
}

function initializeChat() {
  if (chatInitialized) return;
  
  document.getElementById("chat").style.display = "flex";
  chatInitialized = true;
  
  // Load existing messages first, then add greeting
  loadChatMessages(() => {
    // Add greeting message only if no messages exist
    const messagesContainer = document.getElementById("messages");
    if (messagesContainer.children.length === 0) {
      setTimeout(() => {
        botMessage(`Hi ${userName}! 👋 How can I help you today?`);
      }, 500);
    }
  });

  // Focus on input
  setTimeout(() => {
    document.getElementById("input").focus();
  }, 100);
}

function loadChatMessages(callback) {
  const chatRef = db.ref("chats/" + sessionId);

  // Step 1: Remove any previous listeners to prevent stacking (IMPORTANT!)
  chatRef.off();

  // Step 2: Store loaded keys to avoid duplicates
  const loadedKeys = new Set();
  let lastMsgKey = null;

  // Step 3: Load all existing (history) messages ONCE
  chatRef.once("value", (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const key = childSnapshot.key;
        if (data && data.message) {
          if (data.type === "image") {
            addImageMessage(data.message, data.sender, null, data.timestamp, key);
          } else {
            addMessage(data.message, data.sender, null, data.timestamp, key);
          }
          loadedKeys.add(key);
          lastMsgKey = key;
        }
      });
    }

    // Step 4: Real-time listener for **NEW** messages only (no repeats)
    chatRef.orderByKey().startAt(lastMsgKey ? lastMsgKey : "").on("child_added", (snapshot) => {
      // If already loaded (from history), skip
      if (loadedKeys.has(snapshot.key)) return;

      const data = snapshot.val();
      if (data && data.message) {
        if (data.type === "image") {
          addImageMessage(data.message, data.sender, null, data.timestamp, snapshot.key);
        } else {
          addMessage(data.message, data.sender, null, data.timestamp, snapshot.key);
        }
        loadedKeys.add(snapshot.key);
      }
    });

    // Step 5: Callback when done loading
    if (callback) callback();
  });
}




function addMessage(text, sender, name, timestamp = Date.now(), messageKey = null) {
  const messagesContainer = document.getElementById("messages");

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
    else avatarSrc = "images/agent-avatar.png";
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

    // 3-dot icon
    const menuBtn = document.createElement("button");
    menuBtn.className = "msg-menu";
    menuBtn.innerHTML = "&#8942;"; // vertical ellipsis

    // Dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "msg-dropdown";
    dropdown.style.display = "none";
    dropdown.innerHTML = `<div class="msg-dropdown-item">Delete for everyone</div>`;

    // Toggle dropdown
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    };
    // Click outside closes
    document.addEventListener("click", () => { dropdown.style.display = "none"; });

    // Delete click
    dropdown.querySelector(".msg-dropdown-item").onclick = () => {
      if (messageKey) deleteMessageFromFirebase(messageKey);
    };

    msgActions.appendChild(menuBtn);
    msgActions.appendChild(dropdown);
    bubbleDiv.appendChild(msgActions);
  }

  msgDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
  }

  if (!customText) input.value = "";

  // CANCEL any previous pending bot reply
  if (pendingBotReplyTimeout) {
    clearTimeout(pendingBotReplyTimeout);
    pendingBotReplyTimeout = null;
  }

  // Schedule fallback bot reply in 30 seconds (or whatever time you want)
  pendingBotReplyTimeout = setTimeout(() => {
    // Only send fallback if NO agent has replied in the meantime
    botMessage("Thank you for your message. Our team will get back to you soon! 😊");
    pendingBotReplyTimeout = null;
  }, 30000); // 30000 ms = 30 seconds

  // Don't send the fallback reply immediately!
}




function presetClick(message) {
  sendMsg(message);
}

function uploadImage() {
  const fileInput = document.getElementById("imageUpload");
  const file = fileInput.files[0];

  if (!file || !sessionId) {
    alert("Please select an image.");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("sessionId", sessionId);

  fetch("upload.php", {
    method: "POST",
    body: formData
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // JUST push to Firebase:
        db.ref("chats/" + sessionId).push({
          sender: "user",
          message: data.url,
          type: "image",
          timestamp: Date.now()
        });
        // DO NOT call addImageMessage() here!
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
