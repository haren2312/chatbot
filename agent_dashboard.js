  // === FIREBASE CONFIGURATION ===
  const firebaseConfig = {
    apiKey: "AIzaSyCuzXtnMzjJ76N8PH-I4ZND5NnyVfD3XjE",
    authDomain: "chatbot-0405.firebaseapp.com",
    databaseURL: "https://chatbot-0405-default-rtdb.firebaseio.com",
    projectId: "chatbot-0405",
    storageBucket: "chatbot-0405.appspot.com",
    messagingSenderId: "62504000476",
    appId: "1:62504000476:web:c1a92e6fa1db26b1668d19"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // === GLOBAL STATE ===
  let selectedSessionId = null;
  let allSessions = {};
  let allUserData = {};
  let currentChatListener = null;

  // --- UTILS ---
  function escapeHtml(unsafe) {
    if (typeof unsafe !== "string") return "";
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
 // Place this with your other utils at the top
function getAvatarGradient(name = "") {
  const gradients = [
  "linear-gradient(135deg, #8eaee6 0%, #5175b9 100%)",   // Muted strong blue
  "linear-gradient(135deg, #a684b4 0%, #71688a 100%)",   // Subtle deep lavender
  "linear-gradient(135deg, #74b8a3 0%, #418172 100%)",   // Matte teal/green
  "linear-gradient(135deg, #dfbf71 0%, #ad9860 100%)",   // Muted gold/sand
  "linear-gradient(135deg, #e4a692 0%, #b8816a 100%)",   // Earthy peach
  "linear-gradient(135deg, #779fc6 0%, #466181 100%)",   // Blue-grey
  "linear-gradient(135deg, #b5b7c7 0%, #757a8d 100%)"    // Steely matte
];


  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}
function getCountryFlagImg(countryCode = "IN", size = 20) {
  return `<img src="https://flagcdn.com/${size}x${Math.round(size*0.75)}/${countryCode.toLowerCase()}.png" 
    alt="${countryCode.toUpperCase()} flag" style=vertical-align:middle;" />`;
}



  function getCountryFlag(countryCode = "IN") {
    if (!countryCode) return "🏳️";
    return countryCode.toUpperCase().replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
  }
  function notify(message, options = {}) {
    const el = document.getElementById('notification-toast');
    el.textContent = message;
    el.style.background = options.type === "error" ? "#e53935" : "#2563eb";
    el.style.opacity = "1.0";
    el.style.display = "block";
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => { el.style.display = "none"; }, 400);
    }, options.timeout || 2500);
  }

  // --- SIDEBAR: Session List ---
  function renderSessions(filter = "") {
  const sessionList = document.getElementById("sessionList");
  sessionList.innerHTML = "";
  const sessionIds = Object.keys(allSessions);
  if (sessionIds.length === 0) {
    sessionList.innerHTML = '<div class="empty-state">No chat sessions found</div>';
    return;
  }
  let hasResults = false;
  for (let sid of sessionIds) {
    const userData = allUserData[sid];
    if (!userData || !userData.name) continue; // Only show if user exists and has name
    if (filter && !userData.name.toLowerCase().includes(filter)) continue;
    hasResults = true;
    const initials = getInitials(userData.name);
    const avatarGradient = getAvatarGradient(userData.name + (userData.country || "IN"));
    const isSelected = selectedSessionId === sid ? "selected" : "";
    const countryFlag = getCountryFlagImg(userData.country || "IN", 20);

    // Get last message and time
    let lastMsg = "";
    let lastMsgTime = "";
    const chatData = allSessions[sid];
    if (chatData) {
      // Convert messages to array, sort by timestamp
      const messagesArr = Object.entries(chatData)
        .map(([msgId, msg]) => ({ ...msg, _id: msgId }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      if (messagesArr.length) {
        const last = messagesArr[messagesArr.length - 1];
        if (last.type === "image") {
          lastMsg = "📷 Image";
        } else {
          lastMsg = last.message || "";
        }
        if (last.timestamp) {
          const d = new Date(last.timestamp);
          // If today, show time; else show date
          const now = new Date();
          if (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          ) {
            lastMsgTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          } else {
            lastMsgTime = d.toLocaleDateString();
          }
        }
      }
    }
    if (!lastMsg) lastMsg = "<i>No messages yet</i>";

    const sessionBtn = document.createElement("div");
    sessionBtn.className = `session-item ${isSelected}`;
    sessionBtn.innerHTML = `
      <div style="display:flex;align-items:center;gap:11px;position:relative;">
        <div style="position:relative;width:45px;height:45px;">
          <div class="user-avatar"
            style="width:45px;height:45px;border-radius:50%;background:${avatarGradient};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:1.1rem;box-shadow:0 1px 8px #15193544;">
            ${escapeHtml(initials)}
          </div>
          <span class="country-flag"  
            title="${userData.country || "IN"}"
            style="position: absolute; right: -2px; bottom: -3px;">
            ${countryFlag}
          </span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:1em;color:black;text-overflow:ellipsis;overflow:hidden;">
            ${escapeHtml(userData.name)}
          </div>
          <div class="session-info" style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden;color:#656e7e;">
            <span style="display:inline-block;max-width:150px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;">
              ${lastMsg}
            </span>
            <span style="color:#a6a6a6;font-size:.8em;float:right;padding-left:8px;">${lastMsgTime}</span>
          </div>
        </div>
      </div>
    `;
    sessionBtn.onclick = () => loadChat(sid);
    sessionList.appendChild(sessionBtn);
  }
  if (!hasResults) {
    sessionList.innerHTML = '<div class="empty-state">No sessions match your search</div>';
  }
}


  // --- USER INFO PANEL ---
 function renderUserInfoPanel() {
  const userInfoList = document.getElementById("user-info-list");
  if (!selectedSessionId || !allUserData[selectedSessionId]) {
    userInfoList.innerHTML = "";
    return;
  }
  const user = allUserData[selectedSessionId];
  const initials = getInitials(user.name);
  const avatarGradient = getAvatarGradient(user.name + (user.country || "IN"));
  const lat = user.location?.latitude || user.latitude;
  const lng = user.location?.longitude || user.longitude;
  const city = user.city || "Unknown City";
  const country = user.country || "IN";
  const countryFlag = getCountryFlagImg(country, 20);
  // Calculate time (for demo, just show current time)
  const now = new Date();
  const localTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const timezoneOffset = Intl.DateTimeFormat().resolvedOptions().timeZone;

  userInfoList.innerHTML = `
    <div class="modern-user-card" id="user-info-${selectedSessionId}">
      <div class="modern-avatar"
        style="background:${avatarGradient};color:#fff;position:relative;box-shadow:0 3px 10px #15193533; width: 60px;height: 60px;">
        ${initials}
        <span class="country-flag" title="${country}" style="position:absolute;right:-8px;bottom:-5px;">
          ${countryFlag}
        </span>
      </div>
      <div class="modern-user-details" style="flex:1;">
        <span class="modern-user-name">${escapeHtml(user.name)}</span>
        <span class="modern-user-email">${escapeHtml(user.email || "")}</span>
      </div>
      <button class="modern-edit-btn" onclick="openEditModal('${selectedSessionId}')">✏️</button>
    </div>
    <!-- Extra user info like in the Jira-style panel -->
    <div class="modern-user-extra">
    <div>
    <p style="border: 1px solid lightgray;
    padding: 10px 5px;
    text-align: center;
    background: #eaeded;" >Main Informations</p><br>
    </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">📍</span>
        <span>${city}, ${country}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">🕒</span>
        <span>${localTime} <span style="color:#7a8599;font-size:.8em;">(${timezoneOffset})</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">🌍</span>
        <span>${countryFlag}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:9px;">
  <span style="font-size:1.3em;">📆</span>
  <span>${getFormattedDateByTimezone()}</span>
</div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">🌐</span>
        <a href="https://einvite.website/" target="_blank" style="color:#2563eb;text-decoration:underline;">https://einvite.website/</a>
      </div>
    </div>
  `;
}

function getFormattedDateByTimezone(timezone = "Asia/Kolkata") {
  // Example: "09 Jun 2025"
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone
  });
}



  // --- MODAL ---
  function openEditModal(sessionId) {
    const user = allUserData[sessionId] || {};
    document.getElementById("editModal").setAttribute("data-session-id", sessionId);
    document.getElementById("editName").value = user.name || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editLat").value = user.location?.latitude || user.latitude || "";
    document.getElementById("editLng").value = user.location?.longitude || user.longitude || "";
    document.getElementById("editModal").style.display = "block";
    document.getElementById("modalBackdrop").style.display = "block";
  }
  function closeModal() {
    document.getElementById("editModal").style.display = "none";
    document.getElementById("modalBackdrop").style.display = "none";
  }
  function saveUserEdit() {
    const sessionId = document.getElementById("editModal").getAttribute("data-session-id");
    const name = document.getElementById("editName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const latitude = document.getElementById("editLat").value.trim();
    const longitude = document.getElementById("editLng").value.trim();
    if (!sessionId || !db) return notify("Invalid session or database not initialized.", { type: "error" });
    if (!name || !email) {
      notify("Name and email are required.", { type: "error" }); return;
    }
    // Safe update
    const userData = {
      name, email,
      location: { latitude: latitude || "", longitude: longitude || "" }
    };
    db.ref("users/" + sessionId).update(userData)
      .then(() => {
        notify("User profile updated!", { type: "success" });
        closeModal();
      })
      .catch((err) => {
        notify("Failed to update user profile: " + err.message, { type: "error" });
      });
  }

  // --- CHAT PANEL ---
  function renderChatMessages(chatData) {
  const chatBox = document.getElementById('chatBox');
  chatBox.innerHTML = "";
  if (!chatData) {
    chatBox.innerHTML = `<div class="empty-state"><h3>No messages yet</h3></div>`;
    return;
  }
  const messagesArr = Object.entries(chatData)
    .map(([msgId, msg]) => ({ ...msg, _id: msgId }))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  
  let lastMessageDate = null;
  
  messagesArr.forEach((msg) => {
    // -- Date and time logic --
    const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const day = dateObj.toLocaleDateString();
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // -- Date separator, only show when the date changes --
    if (lastMessageDate !== day) {
      chatBox.innerHTML += `<div class="date-separator" style="text-align:center;margin:16px 0 8px 0;color:#000000;font-weight:500;background:white;background-color:#eaeded;border-radius:8px;padding:0px 0;">${day}</div>`;
      lastMessageDate = day;
    }

    // -- Sender logic --
    let senderType = (msg.sender || "").toLowerCase();
    let senderClass = "user";
    let initials = "?";
    let avatarColor = "#eee";

    if (senderType === "agent" || senderType === "admin") {
      senderClass = "agent";
      initials = "A";
      avatarColor = "#ffe5bb";
    } else if (senderType === "bot") {
      senderClass = "bot";
      initials = "<img src='images/logo.jpg' alt='Bot' style='width:30px; border-radius: 50%; height:30px;'/>";
      avatarColor = "#fffac0";
    } else {
      let name = (allUserData[selectedSessionId]?.name || msg.sender || "");
      initials = getInitials(name);
      avatarColor = getAvatarGradient(name + (allUserData[selectedSessionId]?.country || "IN"));
    }

    // -- Message Content --
    let messageContent = "";
    if (msg.type === "image" && msg.message) {
      messageContent = `<img src="${escapeHtml(msg.message)}" alt="image" style="max-width:160px;max-height:110px;border-radius:7px;cursor:pointer;box-shadow:0 1px 5px #2563eb1a;" onclick="window.open('${escapeHtml(msg.message)}','_blank')"/>`;
    } else {
      messageContent = escapeHtml(msg.message || "");
    }

    // -- Alignment & style: agent/admin on RIGHT, bot/user on LEFT --
    let isRight = senderClass === "agent";
    let flexJustify = isRight ? "flex-end" : "flex-start";
    let avatarOrder = isRight ? "order:2;margin-left:10px;" : "order:1;margin-right:10px;";
    let bubbleOrder = isRight ? "order:1;" : "order:2;";
    let bubbleColor = isRight
      ? "background:#ffffff;color:black;"
      : "background:linear-gradient(98deg, #2563eb 90%, #1877f2 100%);color:#fff;";

    if (senderClass === "bot") {
      bubbleColor = "background:linear-gradient(98deg, #2563eb 90%, #1877f2 100%);color:#fff;";
    }

    // -- Message bubble HTML --
    chatBox.innerHTML += `
      <div style="display:flex;align-items:flex-end;justify-content:${flexJustify};margin-bottom:14px;">
    ${senderType === "agent" || senderType === "admin" ? "" : `
      <div class="avatar-bubble" style="width:32px;height:32px;border-radius:50%;background:${avatarColor};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;${avatarOrder}">
        ${initials}
      </div>
    `}
        <div class="message-bubble"
             style="padding:11px 16px 9px 16px;border-radius:13px;min-width:38px;max-width:70vw;box-shadow:0 1px 7px #2563eb12;background:rgb(255, 255, 255); position:relative;${bubbleOrder}${bubbleColor}">
          <div>${messageContent}</div>
          <div class="msg-time" style="display:block;text-align:right;color:#bdbdbd;font-size:0.8em;margin-top:4px;">
            ${timeString}
          </div>
        </div>
      </div>
    `;
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

const navToggle = document.getElementById("navToggle");
const navBar = document.getElementById("nav-bar");
navToggle.onclick = () => {
  navBar.classList.toggle("collapsed");
};

// Optionally collapse on outside click (small screens)
document.addEventListener("click", function(e){
  if (window.innerWidth < 700 &&
      !navBar.contains(e.target) &&
      !navToggle.contains(e.target)) {
    navBar.classList.add("collapsed");
  }
});



  // --- Chat selection & loading ---
  function loadChat(sessionId) {
    if (!sessionId || !db) return;
    if (currentChatListener && selectedSessionId) {
      db.ref("chats/" + selectedSessionId).off("value", currentChatListener);
    }
    selectedSessionId = sessionId;
    document.getElementById("inputGroup").style.display = "flex";
    // Highlight session in sidebar
    document.querySelectorAll(".session-item").forEach(item => {
      item.classList.remove("selected");
    });
    renderUserInfoPanel();
    currentChatListener = (snapshot) => {
      try {
        const chatData = snapshot.val();
        renderChatMessages(chatData);
        renderUserInfoPanel();
      } catch (error) {
        notify("Failed to load chat messages.", { type: "error" });
      }
    };
    db.ref("chats/" + sessionId).on("value", currentChatListener);
    renderUserInfoPanel();
  }

  // --- Firebase listeners ---
  function initializeApp() {
    db.ref("chats").on("value", (snapshot) => {
      allSessions = snapshot.val() || {};
      renderSessions(document.getElementById("searchInput").value.toLowerCase());
    });
    db.ref("users").on("value", (snapshot) => {
      allUserData = snapshot.val() || {};
      renderSessions(document.getElementById("searchInput").value.toLowerCase());
      renderUserInfoPanel();
    });
  }
  window.addEventListener('load', initializeApp);

  // --- Send message ---
  document.getElementById("sendBtn").onclick = () => {
    const msgInput = document.getElementById("msgInput");
    const msg = msgInput.value.trim();
    if (!msg || !selectedSessionId || !db) return;
    const messageData = {
      sender: "agent",
      message: msg,
      type: "text",
      timestamp: Date.now()
    };
    db.ref("chats/" + selectedSessionId).push(messageData).then(() => {
      msgInput.value = "";
    });
  };
  document.getElementById("msgInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("sendBtn").onclick();
  });

  // --- Emoji picker ---
  const emojiBtn = document.getElementById("emojiBtn");
  const emojiPicker = document.getElementById("emojiPicker");
  emojiBtn.onclick = (e) => {
    e.stopPropagation();
    emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
  };
  emojiPicker.addEventListener("click", (e) => {
    if (e.target.tagName === "SPAN") {
      document.getElementById("msgInput").value += e.target.textContent;
      document.getElementById("msgInput").focus();
      emojiPicker.style.display = "none";
    }
  });
  document.addEventListener("click", () => {
    emojiPicker.style.display = "none";
  });

  // --- Image Upload ---
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  uploadBtn.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (!selectedSessionId || !db) {
      notify("Please select a chat session first.", { type: "error" });
      return;
    }
    if (!file.type.startsWith('image/')) {
      notify("Only image files are allowed.", { type: "error" });
      return;
    }
    // NOTE: You need your own image upload handler.
    // For demo, we'll fake upload by converting to base64 and "uploading" it directly.
    const reader = new FileReader();
    reader.onload = function(e) {
      const messageData = {
        sender: "agent",
        message: e.target.result,
        type: "image",
        timestamp: Date.now()
      };
      db.ref("chats/" + selectedSessionId).push(messageData);
      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  };

  // --- Modal close on background click ---
  document.getElementById("modalBackdrop").onclick = closeModal;

  // --- Search filter ---
  document.getElementById("searchInput").addEventListener('input', function() {
    renderSessions(this.value.toLowerCase());
  });

  // Make saveUserEdit globally available (for modal)
  window.saveUserEdit = saveUserEdit;
  window.openEditModal = openEditModal;
  window.closeModal = closeModal;