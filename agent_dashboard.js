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
    "linear-gradient(135deg, #313860 0%, #dc3e1b  100%)",
    "linear-gradient(135deg, #512da8 0%, #e07415 100%)",
    "linear-gradient(135deg, #17627a 0%, #3699d3 100%)",
    "linear-gradient(135deg, #40407a 0%, #1e2242 100%)",
    "linear-gradient(135deg, #043927 0%, #e07415 100%)",
    "linear-gradient(135deg, #6a11cb 0%, #d84a31 100%)",
    "linear-gradient(135deg, #191654 0%, #43c6ac 100%)"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}
function getCountryFlagImg(countryCode = "IN", size = 20) {
  return `<img src="https://flagcdn.com/${size}x${Math.round(size*0.75)}/${countryCode.toLowerCase()}.png" 
    alt="${countryCode.toUpperCase()} flag" style= border-radius:50px;vertical-align:middle; wi " />`;
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
            <div class="session-info" style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">
              ${escapeHtml(userData.email || "")}
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
      userInfoList.innerHTML = ""; // Nothing if no user selected!
      return;
    }
    const user = allUserData[selectedSessionId];
    const initials = getInitials(user.name);
    const avatarGradient = getAvatarGradient(user.name + (user.country || "IN"));
    const lat = user.location?.latitude || user.latitude;
    const lng = user.location?.longitude || user.longitude;
    const countryFlag = getCountryFlagImg(user.country || "IN", 20);
    const locationLink = (lat && lng)
      ? `<a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="modern-map-link">📍 Location</a>`
      : `<span class="modern-map-link disabled">📍Location N/A</span>`;
    userInfoList.innerHTML = `
      <h3>User Profile</h3>
      <div class="modern-user-card" id="user-info-${selectedSessionId}">
        <div class="modern-avatar"
  style="background:${avatarGradient};color:#fff;position:relative;box-shadow:0 3px 10px #15193533;">
  ${initials}
  <span class="country-flag" title="${user.country || "IN"}"
        style="position:absolute;right:-13px;bottom:0;">
    ${countryFlag}
  </span>
</div>
        <div class="modern-user-details" style="flex:1;">
          <span class="modern-user-name">${escapeHtml(user.name)}</span>
          <span class="modern-user-email">📧${escapeHtml(user.email || "")}</span>
          <span class="modern-user-meta">${locationLink}</span>
        </div>
        <button class="modern-edit-btn" onclick="openEditModal('${selectedSessionId}')">✏️</button>
      </div>
    `;
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
    messagesArr.forEach((msg) => {
      let senderType = (msg.sender || "").toLowerCase();
      let align = "left";
      let initials = "?";
      let avatarColor = "#eee";
      if (senderType === "agent" || senderType === "admin") {
        align = "right";
        initials = "A";
        avatarColor = "#ffe5bb";
      } else if (senderType === "bot") {
        initials = "🤖";
        avatarColor = "#fffac0";
      } else {
        let name = (allUserData[selectedSessionId]?.name || msg.sender || "");
        initials = getInitials(name);
        avatarColor = getAvatarGradient(name + (allUserData[selectedSessionId]?.country || "IN"));

      }
      // Format date+time
      const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
      const dateStr = dateObj.toLocaleString(); // full date + time
      let messageContent = "";
      if (msg.type === "image" && msg.message) {
        messageContent = `<img src="${escapeHtml(msg.message)}" alt="image" style="max-width:160px;max-height:110px;border-radius:7px;cursor:pointer;box-shadow:0 1px 5px #2563eb1a;" onclick="window.open('${escapeHtml(msg.message)}','_blank')"/>`;
      } else {
        messageContent = escapeHtml(msg.message || "");
      }
      let flexJustify = align === "right" ? "flex-end" : "flex-start";
      let avatarOrder = align === "right" ? "order:2;margin-left:10px;" : "order:1;margin-right:10px;";
      let bubbleOrder = align === "right" ? "order:1;" : "order:2;";
      chatBox.innerHTML += `
        <div style="display:flex;align-items:flex-end;justify-content:${flexJustify};margin-bottom:14px;">
          <div class="avatar-bubble" style="width:32px;height:32px;border-radius:50%;background:${avatarColor};color:#673ab7;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.08rem;${avatarOrder}">
            ${initials}
          </div>
          <div class="message-bubble"
               style="padding:10px 15px 8px 15px;border-radius:13px;min-width:38px;max-width:65vw;box-shadow:0 1px 7px #2563eb12;position:relative;${bubbleOrder}">
            ${messageContent}
            <span style="display:block;text-align:right;color:#a2abc7;font-size:0.86em;margin-top:3px;">${dateStr}</span>
          </div>
        </div>
      `;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

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