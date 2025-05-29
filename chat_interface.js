<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js"></script>



const storage = firebase.storage();


let chatStep = 0;  // 0 = ask name, 1 = ask email, 2 = ask location, 3 = normal chat
let userData = {
  name: '',
  email: '',
  location: null
};

// Create chatbot UI container and inject into #chatbot-widget element
const chatbotBox = document.createElement('div');
chatbotBox.id = 'chatbot-box';
chatbotBox.innerHTML = `
  <div id="chat-header">Seva Bot</div>
  <div id="chat-body"></div>
  <div id="chat-suggestions" style="padding: 5px; display: flex; flex-wrap: wrap; gap: 5px;"></div>
  <div id="chat-input">
    <input type="text" id="user-msg" placeholder="Type your message..." />
    <button onclick="handleUserMessage()">Send</button>
  </div>
`;
document.getElementById('chatbot-widget').appendChild(chatbotBox);

let senderId = 1;     // Customer user ID
let receiverId = 2;   // Admin ID or bot ID
let liveMode = false; // If true, messages go directly to admin

// Predefined quick-reply suggestions shown after user shares info
const suggestions = [
  "Where is my order?",
  "How do I return an item?",
  "I want a refund",
  "Talk to a human",
  "Help me with payment",
  "Cancel my order"
];

// Show suggestions buttons (except during location-sharing step)
function renderSuggestions() {
  const container = document.getElementById('chat-suggestions');
  container.innerHTML = '';
  if (liveMode) return; // Hide suggestions when live mode active

  suggestions.forEach(text => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.padding = '6px 10px';
    btn.style.border = '1px solid #ccc';
    btn.style.borderRadius = '15px';
    btn.style.background = '#f1f1f1';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      appendMessage(text, 'user');
      handleBotReply(text.toLowerCase());
    };
    container.appendChild(btn);
  });
}

db.ref("chats/" + sessionId).push({
  sender: "user",
  message: url,
  type: "image",
  timestamp: Date.now()
});

// Append a chat message to the chat body area
// sender: 'bot' or 'user', delay in ms for bot typing simulation
function appendMessage(text, sender = 'bot', delay = 0) {
  const chatBody = document.getElementById('chat-body');

  if (delay > 0 && sender === 'bot') {
    // Show "typing..." indicator for delay duration
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.textContent = 'Seva Bot is typing...';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typingDiv.remove();

      const div = createMessageDiv(text, sender);
      chatBody.appendChild(div);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, delay);
  } else {
    // Instant message (no delay)
    const div = createMessageDiv(text, sender);
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

// Helper: create a chat message div styled for bot or user
function createMessageDiv(text, sender) {
  const div = document.createElement('div');
  div.classList.add('animated-message');
  div.style.background = sender === 'bot' ? '#eeeeee' : '#cce5ff';
  div.style.padding = '10px 14px';
  div.style.margin = '6px';
  div.style.borderRadius = '18px';
  div.style.maxWidth = '75%';

  if (sender === 'bot') {
    div.innerHTML = `
      <div style="display: flex; align-items: flex-start;">
        <img src="bot-avatar.png" alt="Bot" style="width: 28px; height: 28px; border-radius: 50%; margin-right: 8px;" />
        <span>${text}</span>
      </div>
    `;
  } else {
    div.textContent = text;
    div.style.textAlign = 'right';
  }

  return div;
}

sessionBtn.classList.add("session-item");
if (sid === selectedSessionId) {
  sessionBtn.classList.add("selected");
}

// Main handler when user clicks Send button or presses Enter

function handleUserMessage(message) {
  appendMessage(message, "user");
  userInput.value = "";
  inputLocked = true;

  if (chatStep === 0) {
    userData.name = message;
    appendMessage("Nice to meet you, " + userData.name + "! What's your email?", 'bot', 800);
    chatStep = 1;
  } else if (chatStep === 1) {
    userData.email = message;
    appendMessage("Can I access your location to serve you better?", 'bot', 800);
    
    const btn = document.createElement("button");
    btn.innerText = "Share Location";
    btn.className = "location-button";
    btn.onclick = requestLocation; // Attach location handler
    chatMessages.appendChild(btn);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatStep = 2;
  } else {
    // Proceed with normal chat or bot logic
    getBotResponse(message);
  }
}

function requestLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      userData.location = { latitude, longitude };

      // Store in Firebase
      db.ref("userData/" + sessionId).set({
        name: userData.name,
        email: userData.email,
        latitude,
        longitude,
      });

      // Send to PHP backend
      fetch("save_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...userData })
      });

      appendMessage("Thanks for sharing your location! How can I assist you today?", 'bot', 800);
      renderSuggestions();
      chatStep = 3;
    });
  } else {
    appendMessage("Geolocation is not supported by your browser.", 'bot', 500);
  }
}



// Basic email format validation regex
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

document.getElementById("imageInput").addEventListener("change", function () {
    const formData = new FormData();
    formData.append("image", this.files[0]);

    fetch("upload_image.php", {
        method: "POST",
        body: formData
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              let img = document.createElement("img");
              img.src = data.image;
              img.className = "chat-image";
              document.getElementById("chatMessages").appendChild(img);
          } else {
              alert("Image upload failed: " + data.error);
          }
      });
});


// Show "Share My Location" button during location step
function showLocationButton() {
  const chatSuggestions = document.getElementById('chat-suggestions');
  chatSuggestions.innerHTML = ''; // Clear existing suggestions

  const btn = document.createElement('button');
  btn.textContent = 'Share My Location 📍';
  btn.style.padding = '6px 10px';
  btn.style.border = '1px solid #ccc';
  btn.style.borderRadius = '15px';
  btn.style.background = '#f1f1f1';
  btn.style.cursor = 'pointer';

btn.onclick = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // USE collected data from earlier steps
      const userInfo = {
        name: userData.name,
        email: userData.email,
        latitude: latitude,
        longitude: longitude
      };

      userData.location = { latitude, longitude };

      // Save to Firebase
      firebase.database().ref("userData/" + sessionId).set(userInfo);

      // Save to backend
      fetch("save_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId, ...userInfo })
      });

      // Continue the chat
      appendMessage("Thanks for sharing your location! How can I assist you today?", 'bot', 800);
      renderSuggestions(); // show quick replies
      chatStep = 3;
    });
  } else {
    appendMessage("Geolocation is not supported by your browser.", 'bot', 500);
  }
};


  chatSuggestions.appendChild(btn);
}

// Send user info (name, email, location) to backend PHP endpoint via POST JSON
function saveUserInfoToBackend(data) {
  fetch('save_user_info.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(response => {
    if (response.success) {
      appendMessage("Your details have been saved successfully!", 'bot', 500);
    } else {
      appendMessage("Oops! Something went wrong saving your details.", 'bot', 500);
    }
  })
  .catch(() => {
    appendMessage("Network error while saving your details.", 'bot', 500);
  });
}

// Example bot reply handler with some common queries
function handleBotReply(msg) {
  if (msg.includes("order status") || msg.includes("track order")) {
    appendMessage("Please enter your order ID to check the current status.", 'bot', 1000);
  } else if (msg.match(/order[\s:-]*\d{5,}/)) {
    appendMessage("Order is in transit and will be delivered in 2-3 days. You’ll get updates via SMS and email.", 'bot', 1200);
  } else if (msg.includes("return")) {
    appendMessage("Want to return an item? Go to 'Orders' > 'Return Item'. You have 7 days from delivery date.", 'bot', 1000);
  } else if (msg.includes("refund")) {
    appendMessage("Refunds are usually processed within 5–7 working days. Let me know if it's delayed.", 'bot', 1000);
  } else if (msg.includes("cancel")) {
    appendMessage("To cancel your order, visit 'My Orders' and click on 'Cancel'.", 'bot', 1000);
  } else if (msg.includes("payment")) {
    appendMessage("We support UPI, NetBanking, Cards, Wallets & Cash on Delivery. Safe & secure!", 'bot', 1000);
  } else if (msg.includes("product") || msg.includes("iphone") || msg.includes("laptop")) {
    appendMessage("Here are some products you might like:\n1. iPhone 15 - ₹79,999\n2. Realme Narzo - ₹10,999\n3. Samsung M14 - ₹12,499\n(Type the product name for more info!)", 'bot', 1200);
  } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    appendMessage("Hello! I'm your shopping assistant. How can I help you today?", 'bot', 800);
  } else if (msg.includes("how are you")) {
    appendMessage("I'm always great! I’m here 24/7 to help you with your orders.", 'bot', 1000);
  } else if (msg.includes("your name")) {
    appendMessage("I’m Seva Bot — your AI assistant for shopping & support!", 'bot', 1000);
  } else if (msg.includes("recommend") || msg.includes("suggestion")) {
    appendMessage("Today’s top deals:\n- Redmi Note 12: ₹13,499\n- Noise Smartwatch: ₹1,799\n- Boat Airdopes: ₹999", 'bot', 1000);
  } else if (msg.includes("thank")) {
    appendMessage("You're welcome! Let me know if you need anything else.", 'bot', 800);
  } else if (msg.includes("agent") || msg.includes("human") || msg.includes("talk")) {
    appendMessage("Connecting you to a human agent... please wait a moment.", 'bot', 1200);
  } else if (msg.includes("damage") || msg.includes("broken") || msg.includes("defect") || msg.includes("wrong item")) {
    appendMessage("Oh no! Please upload a clear photo of the item you received so we can assist you better.", 'bot', 1000);
  } else {
    appendMessage("I'm not sure I understand. Would you like to speak with a support agent?", 'bot', 1000);
  }
}

// Send message to admin endpoint (for live chat mode)
function sendToAdmin(msg) {
  fetch('send_message.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `sender=${senderId}&receiver=${receiverId}&message=${encodeURIComponent(msg)}`
  }).then(() => {
    loadMessages();
  });
}

// Load chat messages between sender and receiver (admin/customer)
function loadMessages() {
  fetch(`get_messages.php?sender=${senderId}&receiver=${receiverId}`)
    .then(res => res.json())
    .then(data => {
      const chatBody = document.getElementById('chat-body');
      chatBody.innerHTML = '';
      data.forEach(msg => {
        appendMessage(msg.message, msg.sender_id == senderId ? 'user' : 'bot');
      });
    });
}

// Initialize suggestions on load
renderSuggestions();

// Start conversation by asking for user name
appendMessage("Hello! What is your name?", 'bot', 500);

