
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

  sessionId = generateSessionId(userName);
  
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
  userEmail = emailInput.value.trim();
  
  if (!userEmail || !validateEmail(userEmail)) {
    showError("Please enter a valid email address");
    emailInput.focus();
    return;
  }

  showLoading("email-prompt", "Saving...");

  // Save user data to Firebase
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
    // Fallback if Firebase is not available
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
  if (!db || !sessionId) {
    if (callback) callback();
    return;
  }

  db.ref("chats/" + sessionId).once("value", (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data && data.message) {
          if (data.type === "image") {
            addImageMessage(data.message, data.sender);
          } else {
            addMessage(data.message, data.sender);
          }
        }
      });
    }
    
    if (callback) callback();
  }).catch((error) => {
    console.error("Error loading messages:", error);
    if (callback) callback();
  });

  // Set up real-time listener for new agent messages
  db.ref("chats/" + sessionId).limitToLast(1).on("child_added", (snapshot) => {
    const data = snapshot.val();
    if (data && data.sender === "agent" && data.message) {
      if (data.type === "image") {
        addImageMessage(data.message, "agent");
      } else {
        addMessage("Agent: " + data.message, "agent");
      }
    }
  });
}

function addMessage(text, sender, name, timestamp = Date.now()) {
  const messagesContainer = document.getElementById("messages");

  // DATE and TIME
  const now = new Date(timestamp);
  const dayString = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  // ---- DATE SEPARATOR LOGIC (optional, as before) ----
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
    nameSpan.textContent = name || (sender === "Bot" ? "E Inviter" : "Admin");
    headerDiv.appendChild(avatarDiv);
    headerDiv.appendChild(nameSpan);

    msgDiv.appendChild(headerDiv);
  }

  // --- Message bubble
  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";

  // Message text
  const msgText = document.createElement("div");
  msgText.textContent = text;
  bubbleDiv.appendChild(msgText);

  // --- Time label inside bubble (bottom right) ---
  const timeLabel = document.createElement("span");
  timeLabel.className = "msg-time";
  timeLabel.textContent = timeString;
  bubbleDiv.appendChild(timeLabel);

  msgDiv.appendChild(bubbleDiv);
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}



function sendMessage(message, type = "text") {
  if (!db || !sessionId || !message) return;

  const newMsgRef = db.ref("chats/" + sessionId).push();
  newMsgRef.set({
    message,
    sender: "user",
    type,
    timestamp: Date.now()
  });

  addMessage(message, "user", userName);
}

function addImageMessage(url, sender) {
  addMessage(url, sender);
}

function botMessage(text) {
  addMessage(text, "bot");
  
  // Save to Firebase
  if (db && sessionId) {
    db.ref("chats/" + sessionId).push({
      sender: "bot",
      message: text,
      type: "text",
      timestamp: Date.now()
    }).catch((error) => {
      console.error("Error saving bot message:", error);
    });
  }
}

function sendMsg(customText) {
  const input = document.getElementById("input");
  const msg = (customText || input.value).trim();
  
  if (!msg) return;

  // Add user message to UI
  addMessage(msg, "user");
  
  // Save to Firebase
  if (db && sessionId) {
    db.ref("chats/" + sessionId).push({
      sender: "user",
      message: msg,
      type: "text",
      timestamp: Date.now()
    }).catch((error) => {
      console.error("Error saving user message:", error);
    });
  }
  
  // Clear input if not custom text
  if (!customText) {
    input.value = "";
  }

  // Check for preset reply
  const lower = msg.toLowerCase();
  const reply = presetReplies[lower];

  if (reply) {
    setTimeout(() => {
      botMessage(reply);
    }, 300);
  } else {
    // Generic response for non-preset messages
    setTimeout(() => {
      botMessage("Thank you for your message. Our team will get back to you soon! 😊");
    }, 300);
  }
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
        sendMessage(data.url, "image");
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
  // Toggle chatbot visibility
  document.getElementById("chatbot-toggle").onclick = () => {
    const chatContainer = document.getElementById("chat-container");
    const isVisible = chatContainer.style.display === "flex";
    chatContainer.style.display = isVisible ? "none" : "flex";
    
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
});

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});