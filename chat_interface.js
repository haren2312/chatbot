// Firebase initialization
let db = null;
let storage = null;

// Initialize Firebase if config is available
try {
    if (typeof firebase !== 'undefined') {
        db = firebase.database();
        storage = firebase.storage();
    }
} catch (error) {
    console.warn('Firebase not initialized:', error);
}

// Global variables
let chatStep = 0; // 0 = ask name, 1 = ask email, 2 = ask location, 3 = normal chat
let userData = {
    name: '',
    email: '',
    location: null
};
let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
let senderId = 1;
let receiverId = 2;
let liveMode = false;
let inputLocked = false;

// Predefined quick-reply suggestions
const suggestions = [
    "Where is my order?",
    "How do I return an item?",
    "I want a refund",
    "Talk to a human",
    "Help me with payment",
    "Cancel my order"
];

// Create and initialize chatbot UI
function initializeChatbot() {
    const chatbotWidget = document.getElementById('chatbot-widget');
    if (!chatbotWidget) {
        console.error('Chatbot widget container not found');
        return;
    }

    const chatbotBox = document.createElement('div');
    chatbotBox.id = 'chatbot-box';
    chatbotBox.innerHTML = `
        <div id="chat-header">Seva Bot</div>
        <div id="chat-body"></div>
        <div id="chat-suggestions"></div>
        <div id="chat-input">
            <input type="text" id="user-msg" placeholder="Type your message..." />
            <button id="send-btn" onclick="handleSendMessage()">Send</button>
        </div>
    `;
    
    chatbotWidget.appendChild(chatbotBox);
    setupEventListeners();
    startConversation();
}

// Setup event listeners
function setupEventListeners() {
    const userInput = document.getElementById('user-msg');
    
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !inputLocked) {
                handleSendMessage();
            }
        });
    }

    // Image upload handler if element exists
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
}

// Main message handler
function handleSendMessage() {
    const userInput = document.getElementById('user-msg');
    if (!userInput) return;
    
    const message = userInput.value.trim();
    if (!message || inputLocked) return;

    appendMessage(message, 'user');
    userInput.value = '';
    inputLocked = true;

    // Process message after short delay
    setTimeout(() => {
        processUserMessage(message);
        inputLocked = false;
    }, 300);
}

// Process user message based on chat step
function processUserMessage(message) {
    switch(chatStep) {
        case 0: // Asking for name
            if (message.length < 2) {
                appendMessage("Please enter a valid name (at least 2 characters).", 'bot', 800);
                return;
            }
            userData.name = message;
            appendMessage(`Nice to meet you, ${userData.name}! What's your email address?`, 'bot', 800);
            chatStep = 1;
            break;

        case 1: // Asking for email
            if (!validateEmail(message)) {
                appendMessage("Please enter a valid email address.", 'bot', 800);
                return;
            }
            userData.email = message;
            appendMessage("Can I access your location to serve you better?", 'bot', 800);
            showLocationButton();
            chatStep = 2;
            break;

        case 2: // Location step (handled by button)
            appendMessage("Please use the 'Share My Location' button above to continue.", 'bot', 500);
            break;

        case 3: // Normal chat mode
            if (liveMode) {
                sendToAdmin(message);
            } else {
                handleBotReply(message.toLowerCase());
            }
            break;
    }
}

// Append message to chat with optional delay
function appendMessage(text, sender = 'bot', delay = 0) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    if (delay > 0 && sender === 'bot') {
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            addMessageToDOM(text, sender);
        }, delay);
    } else {
        addMessageToDOM(text, sender);
    }
}

// Add message to DOM
function addMessageToDOM(text, sender) {
    const chatBody = document.getElementById('chat-body');
    const div = createMessageDiv(text, sender);
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Create message div element
function createMessageDiv(text, sender) {
    const div = document.createElement('div');
    div.classList.add('animated-message');
    div.style.background = sender === 'bot' ? '#eeeeee' : '#007bff';
    div.style.color = sender === 'user' ? 'white' : 'black';
    div.style.padding = '10px 14px';
    div.style.margin = '6px';
    div.style.borderRadius = '18px';
    div.style.maxWidth = '75%';
    div.style.wordWrap = 'break-word';
    
    if (sender === 'user') {
        div.style.marginLeft = 'auto';
        div.style.textAlign = 'right';
    }

    div.textContent = text;
    return div;
}

// Show typing indicator
function showTypingIndicator() {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody || document.getElementById('typing-indicator')) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.textContent = 'Seva Bot is typing...';
    typingDiv.style.fontStyle = 'italic';
    typingDiv.style.color = '#666';
    typingDiv.style.padding = '10px';
    
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Show location sharing button
function showLocationButton() {
    const chatSuggestions = document.getElementById('chat-suggestions');
    if (!chatSuggestions) return;

    chatSuggestions.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = 'Share My Location 📍';
    btn.style.padding = '8px 15px';
    btn.style.border = '1px solid #ccc';
    btn.style.borderRadius = '20px';
    btn.style.background = '#ff9800';
    btn.style.color = 'white';
    btn.style.cursor = 'pointer';
    btn.style.margin = '5px';
    
    btn.onclick = requestLocation;
    chatSuggestions.appendChild(btn);
}

// Request user location
function requestLocation() {
    if (!navigator.geolocation) {
        appendMessage("Geolocation is not supported by your browser. You can still continue chatting!", 'bot', 500);
        finalizeChatSetup();
        return;
    }

    appendMessage("Getting your location...", 'bot', 300);

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            userData.location = { latitude, longitude };
            saveUserData();
            
            appendMessage("Thanks for sharing your location! How can I assist you today?", 'bot', 800);
            finalizeChatSetup();
        },
        function(error) {
            let errorMsg = "Unable to get location: ";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += "Permission denied.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += "Position unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMsg += "Request timed out.";
                    break;
                default:
                    errorMsg += "Unknown error.";
            }
            appendMessage(errorMsg + " You can still continue!", 'bot', 800);
            finalizeChatSetup();
        },
        {
            timeout: 10000,
            enableHighAccuracy: false,
            maximumAge: 300000
        }
    );
}

// Finalize chat setup and show suggestions
function finalizeChatSetup() {
    renderSuggestions();
    chatStep = 3;
}

// Save user data to backend and Firebase
function saveUserData() {
    const userInfo = {
        sessionId: sessionId,
        name: userData.name,
        email: userData.email,
        latitude: userData.location?.latitude || null,
        longitude: userData.location?.longitude || null,
        timestamp: Date.now()
    };

    // Save to Firebase if available
    if (db) {
        try {
            db.ref("userData/" + sessionId).set(userInfo);
            if (userData.location) {
                db.ref("chats/" + sessionId).push({
                    sender: "system",
                    message: "User location shared",
                    type: "location",
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Firebase save error:', error);
        }
    }

    // Save to PHP backend
    fetch("save_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo)
    }).catch(error => {
        console.error('Backend save error:', error);
    });
}

// Render suggestion buttons
function renderSuggestions() {
    const container = document.getElementById('chat-suggestions');
    if (!container || liveMode || chatStep !== 3) return;

    container.innerHTML = '';
    suggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.padding = '6px 10px';
        btn.style.border = '1px solid #ccc';
        btn.style.borderRadius = '15px';
        btn.style.background = '#f1f1f1';
        btn.style.cursor = 'pointer';
        btn.style.margin = '2px';
        btn.style.fontSize = '12px';
        
        btn.onclick = () => {
            appendMessage(text, 'user');
            setTimeout(() => {
                handleBotReply(text.toLowerCase());
            }, 500);
        };
        
        container.appendChild(btn);
    });
}

// Handle bot replies with improved responses
function handleBotReply(msg) {
    let reply = "";
    let delay = 1000;

    // Order tracking
    if ((msg.includes("order") || msg.includes("where")) && (msg.includes("status") || msg.includes("track"))) {
        reply = "Please provide your order ID (6-8 digits) to check the status.";
    } 
    // Order ID provided
    else if (msg.match(/\b\d{6,8}\b/)) {
        reply = "Your order is in transit and will be delivered in 2-3 business days. You'll receive SMS and email updates with tracking details.";
        delay = 1200;
    }
    // Returns
    else if (msg.includes("return")) {
        reply = "To return an item:\n1. Go to 'My Orders'\n2. Select 'Return Item'\n3. Choose reason and schedule pickup\n\nYou have 7 days from delivery date.";
    }
    // Refunds
    else if (msg.includes("refund")) {
        reply = "Refunds are processed within 5-7 working days after we receive your returned item. Is there a specific order you're asking about?";
    }
    // Cancel order
    else if (msg.includes("cancel")) {
        reply = "To cancel your order:\n• Visit 'My Orders'\n• Click 'Cancel Order' (if not yet shipped)\n• If shipped, you can return it after delivery.";
    }
    // Payment help
    else if (msg.includes("payment")) {
        reply = "We accept multiple payment methods:\n• UPI (Google Pay, PhonePe, Paytm)\n• Net Banking\n• Credit/Debit Cards\n• Digital Wallets\n• Cash on Delivery\n\nAll payments are 100% secure!";
        delay = 1200;
    }
    // Talk to human
    else if (msg.includes("human") || msg.includes("agent") || msg.includes("talk")) {
        reply = "I'm connecting you to our support team. Please hold on while I transfer your chat...";
        liveMode = true;
        delay = 1500;
        // Hide suggestions when in live mode
        setTimeout(() => {
            const suggestions = document.getElementById('chat-suggestions');
            if (suggestions) suggestions.innerHTML = '';
        }, 2000);
    }
    // Greetings
    else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
        reply = userData.name ? 
            `Hello ${userData.name}! I'm here to help with your orders and questions. What can I do for you?` :
            "Hello! I'm Seva Bot, your shopping assistant. How can I help you today?";
    }
    // Products/recommendations
    else if (msg.includes("product") || msg.includes("recommend") || msg.includes("deal")) {
        reply = "Here are today's top deals:\n🔥 iPhone 15 - ₹79,999\n📱 Samsung Galaxy M14 - ₹12,499\n⚡ Realme Narzo - ₹10,999\n🎧 Boat Airdopes - ₹999\n\nType any product name for more details!";
        delay = 1200;
    }
    // Damage/defect
    else if (msg.includes("damage") || msg.includes("broken") || msg.includes("defect") || msg.includes("wrong")) {
        reply = "I'm sorry to hear about the issue! Please:\n1. Take clear photos of the item\n2. Go to 'My Orders' > 'Report Issue'\n3. Upload photos and describe the problem\n\nWe'll resolve this quickly for you!";
    }
    // Thanks
    else if (msg.includes("thank")) {
        reply = "You're very welcome! Is there anything else I can help you with today?";
        delay = 800;
    }
    // Default response
    else {
        reply = "I want to make sure I help you properly. Could you please clarify what you need help with, or would you like me to connect you with a human agent?";
    }

    appendMessage(reply, 'bot', delay);
}

// Send message to admin (live chat mode)
function sendToAdmin(msg) {
    const messageData = {
        sender: senderId,
        receiver: receiverId,
        message: msg,
        sessionId: sessionId,
        timestamp: Date.now()
    };

    // Save to Firebase if available
    if (db) {
        try {
            db.ref("chats/" + sessionId).push({
                sender: "user",
                message: msg,
                type: "text",
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Firebase chat save error:', error);
        }
    }

    // Send to backend
    fetch('send_message.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            appendMessage("Your message has been sent to our support team. They'll respond shortly.", 'bot', 800);
        } else {
            appendMessage("Sorry, there was an issue sending your message. Please try again.", 'bot', 500);
        }
    })
    .catch(error => {
        console.error('Send message error:', error);
        appendMessage("Connection error. Please check your internet and try again.", 'bot', 500);
    });
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        appendMessage("Please upload a valid image file.", 'bot', 500);
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        appendMessage("Image size should be less than 5MB.", 'bot', 500);
        return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("sessionId", sessionId);

    appendMessage("Uploading image...", 'bot', 300);

    fetch("upload_image.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Create image element
            const img = document.createElement("img");
            img.src = data.imageUrl;
            img.style.maxWidth = "200px";
            img.style.borderRadius = "10px";
            img.style.margin = "5px 0";
            
            const chatBody = document.getElementById('chat-body');
            chatBody.appendChild(img);
            chatBody.scrollTop = chatBody.scrollHeight;
            
            // Save to Firebase
            if (db) {
                db.ref("chats/" + sessionId).push({
                    sender: "user",
                    message: data.imageUrl,
                    type: "image",
                    timestamp: Date.now()
                });
            }
            
            appendMessage("Image uploaded successfully! Our team will review it and respond accordingly.", 'bot', 800);
        } else {
            appendMessage("Failed to upload image: " + (data.error || "Unknown error"), 'bot', 500);
        }
    })
    .catch(error => {
        console.error('Image upload error:', error);
        appendMessage("Error uploading image. Please try again.", 'bot', 500);
    });
}

// Load messages from backend (for live chat)
function loadMessages() {
    if (!liveMode) return;
    
    fetch(`get_messages.php?sender=${senderId}&receiver=${receiverId}&sessionId=${sessionId}`)
        .then(response => response.json())
        .then(data => {
            const chatBody = document.getElementById('chat-body');
            if (data && data.length > 0) {
                // Only add new messages to avoid duplicates
                data.forEach(msg => {
                    if (!document.querySelector(`[data-msg-id="${msg.id}"]`)) {
                        const messageDiv = createMessageDiv(msg.message, msg.sender_id == senderId ? 'user' : 'bot');
                        messageDiv.setAttribute('data-msg-id', msg.id);
                        chatBody.appendChild(messageDiv);
                    }
                });
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        })
        .catch(error => {
            console.error('Load messages error:', error);
        });
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
}

// Start conversation
function startConversation() {
    setTimeout(() => {
        appendMessage("Hello! Welcome to Seva Bot 👋 I'm here to help with your shopping needs. What's your name?", 'bot', 1000);
    }, 500);
}

// Auto-load messages in live mode (polling every 3 seconds)
setInterval(() => {
    if (liveMode) {
        loadMessages();
    }
}, 3000);

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatbot);
} else {
    initializeChatbot();
}