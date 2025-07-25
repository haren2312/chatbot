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


function userRef(sessionId) {
  return db.ref(`users/${selectedWebsiteKey}/${sessionId}`);
}


function attachWebsiteListeners() {
  db.ref("chats").off();
  db.ref("users").off();
  db.ref("status").off();


  // Listen to only the selected website's data
db.ref(`chats/${selectedWebsiteKey}`).on("value", (snapshot) => {
  allSessions = snapshot.val() || {};
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  if (selectedSessionId && allSessions[selectedSessionId]) {
    renderChatMessages(allSessions[selectedSessionId]);
  } else {
    clearChatBox();
  }
});
  db.ref(`users/${selectedWebsiteKey}`).on("value", (snapshot) => {
    allUserData = snapshot.val() || {};
    renderSessions(document.getElementById("searchInput").value.toLowerCase());
    if (selectedSessionId) renderUserInfoPanel();
  });
db.ref("status").on("value", (snapshot) => {
  window.userPresence = snapshot.val() || {};
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  renderUserInfoPanel();
});
}

function clearChatBox() {
  const chatBox = document.getElementById('chatBox');
  if (chatBox) {
    chatBox.innerHTML = `
      <div class="empty-state">
        <h3>Select a chat to view messages</h3>
        <p>Choose a session from the sidebar to start viewing the conversation</p>
      </div>
    `;
  }
  document.getElementById("inputGroup").style.display = "none";
  selectedSessionId = null;
  // Also clear user info:
  if (document.getElementById("user-info-list")) document.getElementById("user-info-list").innerHTML = "";
}


function isImageUrl(url) {
  return typeof url === "string" && /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
}

let activeTab = null;                 // No tab selected at start
let selectedWebsiteKey = null;       // No chat selected at start
window.selectedWebsiteKey = null;

document.addEventListener("DOMContentLoaded", () => {
  activeTab = null;
  selectedWebsiteKey = null;
  window.selectedWebsiteKey = null;
  selectedSessionId = null;
  renderTabBar();
  clearChatBox(); // Shows "Select tabs to view chats"
  renderUserInfoPanel(); // Will clear user info panel
});


let replyToMsg = null; // Stores the message being replied to

const host = window.location.hostname;

if (host.includes("todoitservices")) {
  selectedWebsiteKey = "todoitservices";
} else if (host.includes("einvite")) {
  selectedWebsiteKey = "einvite";
} else if (host.includes("gauravjiandani")) {
  selectedWebsiteKey = "gauravjiandani";
} else {
  // fallback or prompt user
  selectedWebsiteKey = "einvite";
}

window.selectedWebsiteKey = selectedWebsiteKey;

function chatRef(sessionId, msgId = null) {
  return db.ref(msgId ? chatMessagePath(sessionId, msgId) : chatSessionPath(sessionId));
}



function detachAllWebsiteListeners() {
  db.ref("chats").off();
  db.ref("users").off();
  db.ref("status").off();
}
function detachChatListeners() {
  if (currentChatListeners && typeof currentChatListeners === 'object') {
    const chatRefObj = db.ref(`chats/${selectedWebsiteKey}/${selectedSessionId}`);
    if (currentChatListeners.added) chatRefObj.off("child_added", currentChatListeners.added);
    if (currentChatListeners.changed) chatRefObj.off("child_changed", currentChatListeners.changed);
    if (currentChatListeners.removed) chatRefObj.off("child_removed", currentChatListeners.removed);
  }
  currentChatListeners = {};
}





function statusRef(sessionId) {
  return db.ref(`status/${selectedWebsiteKey}/${sessionId}`);
}


function statusRef(sessionId) {
  return db.ref(`status/${selectedWebsiteKey}/${sessionId}`);
}





// --- Website tab switching ---
document.querySelectorAll('.website-tab').forEach(btn => {
  btn.addEventListener('click', function () {
    detachAllWebsiteListeners();
    detachChatListeners();
    selectedWebsiteKey = this.getAttribute('data-site');
    window.selectedWebsiteKey = selectedWebsiteKey;

    // Always clear the chat UI immediately
    clearChatBox();

    renderSessions("");        // Show new sessions for selected tab
    renderUserInfoPanel();     // Clear user info panel

    attachWebsiteListeners();  // Listen for new site
  });
});


// Create the overlay if not already present (best: after DOMContentLoaded)
if (!document.getElementById('chat-preview-fullscreen-overlay')) {
  const overlay = document.createElement('div');
  overlay.id = 'chat-preview-fullscreen-overlay';
  overlay.style = `
    display:none; position:fixed; left:0;top:0;width:100vw;height:100vh;z-index:2147483647;
    background:rgba(15,20,40,0.92); justify-content:center;align-items:center;cursor:zoom-out;
  `;
  overlay.innerHTML = `<img src="" style="max-width:96vw;max-height:96vh;border-radius:16px;box-shadow:0 6px 64px #000a;background:#fff;">`;
  document.body.appendChild(overlay);

  // Hide on overlay click (outside image)
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      overlay.querySelector('img').src = '';
    }
  };
}











// === GLOBAL STATE ===
let selectedSessionId = null;
let allSessions = {};
let allUserData = {};
let currentChatListener = null;
let sessionSortMode = "latest"; // latest, oldest, az, za
let sessionFilterMode = "all";
window.lastViewedTimestamp = {};
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;
window.userPresence = {};
const ADMIN_ID = "admin";

window.lastViewedTimestamp = {};

// Listen to ALL chats and users for session list changes
// GOOD: Always listen under current website key
db.ref(`chats/${selectedWebsiteKey}`).on("value", (snapshot) => {
  allSessions = snapshot.val() || {};
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  if (selectedSessionId && allSessions[selectedSessionId]) {
    renderChatMessages(allSessions[selectedSessionId]);
  } else {
    clearChatBox();
  }
});
db.ref(`users/${selectedWebsiteKey}`).on("value", (snapshot) => {
  allUserData = snapshot.val() || {};
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  if (selectedSessionId) renderUserInfoPanel();
});
db.ref("status").on("value", (snapshot) => {
  window.userPresence = snapshot.val() || {};
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  renderUserInfoPanel();
});



db.ref("admin_last_seen/" + ADMIN_ID).once("value", (snapshot) => {
  window.lastViewedTimestamp = snapshot.val() || {};
  // Render session list after loading
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
});

let presenceTimers = {
  away: null,
  offline: null
};
// window.currentUserId = "userId"; // Replace with actual user ID
document.getElementById("user-typing-indicator").style.display = "none";


function listenForUserTyping(sessionId, userName = "User") {
  const typingRef = db.ref('typing/' + selectedWebsiteKey + '/' + sessionId + '/user');
  typingRef.on("value", (snapshot) => {
    const isTyping = !!snapshot.val();
    const typingEl = document.getElementById("user-typing-indicator");
    const typingUserLabel = document.getElementById("typing-user-label");
    const typingAvatar = typingEl.querySelector(".typing-avatar");
    const user = allUserData[sessionId] || {};

    typingUserLabel.textContent = (user.name || userName) + " is typing";

    // Avatar logic
    if (user.profilePic) {
      typingAvatar.innerHTML = `<img src="${user.profilePic}" alt="User" style="width:22px;height:22px;border-radius:50%;" />`;
    } else {
      const initials = getInitials(user.name || userName);
      const avatarColor = getAvatarGradient(user.name || userName);
      typingAvatar.innerHTML = `<span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${avatarColor};color:#fff;line-height:22px;text-align:center;font-size:13px;">${initials}</span>`;
    }

    // Only show if selected chat
    typingEl.style.display = (isTyping && selectedSessionId === sessionId) ? "flex" : "none";
  });
}


function showOrHideTypingIndicator(isTyping, userName) {
  const el = document.getElementById('user-typing-indicator');
  if (isTyping) {
    el.style.display = "flex";
    // Update text/avatar etc as you want
    document.getElementById('typing-user-label').textContent = `${userName} is typing`;
  } else {
    el.style.display = "none";
  }
}


function refreshPresenceOnActivity() {
  // Clear old timers
  if (presenceTimers.away) clearTimeout(presenceTimers.away);
  if (presenceTimers.offline) clearTimeout(presenceTimers.offline);

  setPresence("online");

  // After 2 min of inactivity, set as away
  presenceTimers.away = setTimeout(() => {
    setPresence("away");
  }, 1 * 60 * 1000);

  // After 5 min of inactivity, set as offline
  presenceTimers.offline = setTimeout(() => {
    setPresence("offline");
  }, 2 * 60 * 1000);
}



function startPresenceTracking() {
  const isOfflineForDatabase = { state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP };
  const isOnlineForDatabase = { state: 'online', last_changed: firebase.database.ServerValue.TIMESTAMP };
  const isAwayForDatabase = { state: 'away', last_changed: firebase.database.ServerValue.TIMESTAMP };

  const connectedRef = db.ref('.info/connected');
  connectedRef.on('value', function (snapshot) {
    if (snapshot.val() === false) return;
    userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
      userStatusDatabaseRef.set(isOnlineForDatabase);
    });
  });

  let idleTimeout = null;
  function setAway() { userStatusDatabaseRef.set(isAwayForDatabase); }
  function setOnline() { userStatusDatabaseRef.set(isOnlineForDatabase); }
  function resetIdleTimer() {
    clearTimeout(idleTimeout);
    setOnline();
    idleTimeout = setTimeout(setAway, 60 * 1000);
  }
  window.onmousemove = window.onkeydown = resetIdleTimer;
  resetIdleTimer();
}


const websites = [
  { key: "todoitservices", label: "ToDo IT", icon: "✅" },
  { key: "gauravjiandani", label: "Gaurav Jiandani", icon: "👨‍💼" },
  { key: "einvite", label: "E Invite", icon: "🌐" }
];
let openTabs = ["todoitservices", "gauravjiandani", "einvite"];
const tabBar = document.getElementById("tabBar");

function renderTabBar() {
  tabBar.innerHTML = "";
  openTabs.forEach((key, idx) => {
    const website = websites.find(w => w.key === key);
    const tabDiv = document.createElement("div");
    tabDiv.className = "tab-pro" + (key === activeTab ? " active" : "");
    tabDiv.innerHTML = `
      <span class="favicon">${website?.icon || "🗂️"}</span>
      <span>${website ? website.label : key}</span>
      ${openTabs.length > 1 ? '<button class="tab-close" title="Close Tab">&times;</button>' : ''}
    `;
    tabDiv.onclick = (e) => {
  if (e.target.classList.contains("tab-close")) return;
  activeTab = key;
  selectedWebsiteKey = key;
  window.selectedWebsiteKey = key;
  selectedSessionId = null; // No chat selected
  renderTabBar();
  renderSessions("");        // Show session list (user list) for that site
  clearChatBox();           // Chat area shows "Select a chat to view messages"
  renderUserInfoPanel();    // User panel blank
  attachWebsiteListeners(); // Start listeners for new site
};

    const closeBtn = tabDiv.querySelector(".tab-close");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        const idx = openTabs.indexOf(key);
        openTabs.splice(idx, 1);
        if (activeTab === key) {
          activeTab = openTabs[Math.max(0, idx - 1)];
          selectedWebsiteKey = activeTab;
        }
        renderTabBar();
        attachWebsiteListeners();
      };
    }
    tabBar.appendChild(tabDiv);
  });
  // "+" add tab
  const addBtn = document.createElement("button");
  addBtn.className = "tab-add-pro";
  addBtn.innerHTML = "+";
  addBtn.onclick = () => {
    const closed = websites.filter(w => !openTabs.includes(w.key));
    if (closed.length === 0) {
      Swal && Swal.fire("All sites open!"); // optional SweetAlert
      return;
    }
    const toOpen = closed[0];
    openTabs.push(toOpen.key);
    activeTab = toOpen.key;
    selectedWebsiteKey = toOpen.key;
    renderTabBar();
    attachWebsiteListeners();
  };
  tabBar.appendChild(addBtn);
}
document.addEventListener("DOMContentLoaded", () => {
  activeTab = null;
  selectedWebsiteKey = null;
  window.selectedWebsiteKey = null;
  selectedSessionId = null;
  renderTabBar();
  clearChatBox(); // Shows "Select tabs to view chats"
  renderUserInfoPanel(); // Will clear user info panel
});




document.addEventListener('DOMContentLoaded', function () {
  // Grab all relevant elements, log errors if missing
  const profilePicInput = document.getElementById('profilePicInput');
  const profilePicPreview = document.getElementById('profilePicPreview');
  const profileModal = document.getElementById('profileModal');
  const modalBackdrop = document.getElementById('profileModalBackdrop');
  const profileEditName = document.getElementById('profileEditName');
  const profileEditEmail = document.getElementById('profileEditEmail');
  const profileEditCity = document.getElementById('profileEditCity');
  const profileEditCountry = document.getElementById('profileEditCountry');
  const saveProfileEdit = document.getElementById('save-btn');

  // Null-check all elements
  if (!profilePicInput) console.warn('[profilePicInput] not found');
  if (!profilePicPreview) console.warn('[profilePicPreview] not found');
  if (!profileModal) console.warn('[profileModal] not found');
  if (!modalBackdrop) console.warn('[profileModalBackdrop] not found');
  if (!profileEditName) console.warn('[profileEditName] not found');
  if (!profileEditEmail) console.warn('[profileEditEmail] not found');
  if (!profileEditCity) console.warn('[profileEditCity] not found');
  if (!profileEditCountry) console.warn('[profileEditCountry] not found');
  if (!saveProfileEdit) console.warn('[save-btn] not found');

  // Profile Picture Change: Preview logic
  if (profilePicInput && profilePicPreview) {
    profilePicInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          profilePicPreview.src = e.target.result;
          window.newProfilePicData = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }


  

  // Expose modal open/close globally, defensively
  window.openProfileModal = function () {
    if (profileModal) profileModal.style.display = "flex";
    if (modalBackdrop) modalBackdrop.style.display = "block";
  };
  window.closeProfileModal = function () {
    if (profileModal) profileModal.style.display = "none";
    if (modalBackdrop) modalBackdrop.style.display = "none";
  };

  // Close modal when clicking backdrop
  if (modalBackdrop) {
    modalBackdrop.onclick = window.closeProfileModal;
  }

  // Save profile logic (replace with your Firebase logic as needed)
  if (saveProfileEdit) {
    saveProfileEdit.onclick = function () {
      // Defensive: get field values only if fields exist
      const name = profileEditName ? profileEditName.value.trim() : '';
      const email = profileEditEmail ? profileEditEmail.value.trim() : '';
      const city = profileEditCity ? profileEditCity.value.trim() : '';
      const country = profileEditCountry ? profileEditCountry.value.trim() : '';

      // Validation: show warning if required fields are missing
      if (!name || !email) {
        Swal.fire({ icon: "warning", text: "Name and Email are required" });
        return;
      }


      // You can plug in your Firebase/database logic here, e.g.:
      // db.ref("users/" + userId).update({ name, email, city, country, ... })
      //   .then(() => alert("Profile updated!"))
      //   .catch((err) => alert("Update failed: " + err.message));

      // Just close modal for demo:
      window.closeProfileModal();
    };
  }
});





// === Firebase Presence Tracking ===
// const userId = 'userId';
// const userStatusDatabaseRef = db.ref('/status/' + userId);

// const isOfflineForDatabase = { state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP };
// const isOnlineForDatabase = { state: 'online', last_changed: firebase.database.ServerValue.TIMESTAMP };
// const isAwayForDatabase = { state: 'away', last_changed: firebase.database.ServerValue.TIMESTAMP };

// const connectedRef = db.ref('.info/connected');
// connectedRef.on('value', function (snapshot) {
//   if (snapshot.val() === false) return;
//   userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
//     userStatusDatabaseRef.set(isOnlineForDatabase);
//   });
// });




// 2. Optional: Idle/away tracking (shows "away" if inactive for X seconds)
// let idleTimeout = null;
// function setAway() { userStatusDatabaseRef.set(isAwayForDatabase); }
// function setOnline() { userStatusDatabaseRef.set(isOnlineForDatabase); }
// function resetIdleTimer() {
//   clearTimeout(idleTimeout);
//   setOnline();
//   idleTimeout = setTimeout(setAway, 60 * 1000);
// }
// window.onmousemove = window.onkeydown = resetIdleTimer;
// resetIdleTimer();



// Reference to your users node (adjust if your users are elsewhere)
// const usersRef = db.ref('/users');

// Fetch all users
// After fetching all users:
// usersRef.once('value', function (snapshot) {
//   const users = snapshot.val();
//   for (const userId in users) {
//     setupPresenceListener(userId);
//   }
// });


// Listen to all users' presence
function setupPresenceListener(sessionId) {
  db.ref(`status/${sessionId}`).on("value", function (snapshot) {
    window.userPresence[sessionId] = snapshot.val() || { state: "offline" };
    renderSessions(document.getElementById("searchInput").value.toLowerCase());
    if (selectedSessionId === sessionId) renderUserInfoPanel();
  });
}



function initializePresenceTracking() {
  // First, get all users and set up listeners
  db.ref('/users').once('value', function (snapshot) {
    const users = snapshot.val() || {};

    console.log('Setting up presence listeners for users:', Object.keys(users));

    // Set up presence listener for each user
    Object.keys(users).forEach(userId => {
      setupPresenceListener(userId);
    });
  });

  // Also listen for new users being added
    // db.ref('/users').on('child_added', function (snapshot) {
    //   const userId = snapshot.key;
    //   console.log('New user detected, setting up presence listener:', userId);
    //   setupPresenceListener(userId);
    // });
}



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

// === ADD THIS FUNCTION ===
function isValidLocation(lat, lng) {
  // Add any fake/test/demo values here:
  const defaultLat = "23.0696448";
  const defaultLng = "70.1095879";
  if (!lat || !lng) return false;
  if (isNaN(Number(lat)) || isNaN(Number(lng))) return false;
  if (lat === "" || lng === "") return false;
  // Optional: Prevent specific fake value
  if (String(lat) === defaultLat && String(lng) === defaultLng) return false;
  return true;
}


// --- Chat path helpers: Always use for all read/write/listener ops ---
function chatSessionPath(sessionId) {
  if (selectedWebsiteKey === "einvite") {
    return `chats/einvite/${sessionId}`;
  } else {
    return `chats/${selectedWebsiteKey}/${sessionId}`;
  }
}
function chatMessagePath(sessionId, msgId) {
  if (selectedWebsiteKey === "einvite") {
    return `chats/einvite/${sessionId}/${msgId}`;
  } else {
    return `chats/${selectedWebsiteKey}/${sessionId}/${msgId}`;
  }
}


function updateMessageStatusUI(msgId, msgData) {
  const msgDiv = document.querySelector(`[data-key="${msgId}"]`);
  if (!msgDiv) return;
  const timeLabel = msgDiv.querySelector('.msg-time');
  if (!timeLabel) return;
  if ((msgData.sender || '').toLowerCase() === 'user') {
    let icon = '';
    if (msgData.status === "read") icon = "✔✔";
    else if (msgData.status === "delivered") icon = "✔✔";
    else icon = "✔";
    timeLabel.innerHTML = timeLabel.textContent.split(' ')[0] +
      ` <span style="color:${msgData.status === "read" ? "#2563eb" : "#bababa"};">${icon}</span>`;
  }
}


// Place this with your other utils at the top
function getAvatarGradient(name = "") {
const gradients = [
  "#1C9ADE", // Twitter Blue, dulled
  "#3990E3", // Tailwind Blue, dulled
  "#2990C7", // Soft Azure, dulled
  "#12A16F", // Vibrant Green, dulled
  "#00AA86", // Mint Green, dulled
  "#249B56", // Emerald, dulled
  "#973DE3", // Soft Purple, dulled
  "#934BC8", // Deep Purple, dulled
  "#5926BE", // Vivid Indigo, dulled
  "#655BC5", // Deep Violet, dulled
  "#E2C35F", // Soft Gold, dulled
  "#E6C000", // Yellow, dulled
  "#D16651", // Orange Coral, dulled
  "#D55353", // Coral Red, dulled
  "#D77B81", // Rose Pink, dulled
  "#E38266"  // Warm Peach, dulled
];



  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}



function getCountryFlagImg(countryCode = "IN", size = 15) {
  // All SVGs are at /3x2/{CODE}.svg (e.g., .../3x2/IN.svg)
  return `<img src="https://unpkg.com/country-flag-icons@1.5.19/3x2/${countryCode.toUpperCase()}.svg"
    alt="${countryCode.toUpperCase()} flag"
    style="vertical-align:middle;width:${size}px;height:${size * 1}px;object-fit:cover;display:inline-block;border-radius: 50%; border: 3px solid #ffffff;" />`;
}




function getCountryFlag(countryCode = "IN") {
  if (!countryCode) return "🏳️";
  return countryCode.toUpperCase().replace(/./g, char =>
    String.fromCodePoint(127397 + char.charCodeAt())
  );
}
function notify(message, options = {}) {
  Swal.fire({
    text: message,
    icon: options.type === "error" ? "error" :
      options.type === "success" ? "success" :
        options.type === "warning" ? "warning" : "info",
    background: options.type === "error" ? "#fff0f0" : "#f5fafd",
    color: "#222e3a",
    showConfirmButton: true,
    confirmButtonText: "OK"
  });
}



function getMessageStatusIcon(msg, isRight) {
  // Only show status for right-side messages (admin/agent/bot)
  if (!isRight) return "";

  // Handle different message statuses
  if (msg.status === "read") {
    // Double blue tick: Read
    return `<span style="margin-left:7px; color:#2563eb; font-size:1.08em; vertical-align:middle;">✔✔</span>`;
  } else if (msg.status === "delivered") {
    // Double grey tick: Delivered but not read
    return `<span style="margin-left:7px; color:#bababa; font-size:1.08em; vertical-align:middle;">✔✔</span>`;
  } else {
    // Single grey tick: Sent but not delivered/read
    return `<span style="margin-left:7px; color:#bababa; font-size:1.08em; vertical-align:middle;">✔</span>`;
  }
}





// Listen for dropdown
document.getElementById("sessionSortMode").addEventListener("change", function () {
  sessionSortMode = this.value;
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
});

// Listen for search bar input
document.getElementById("searchInput").addEventListener('input', function () {
  renderSessions(this.value.toLowerCase());
});


// Setup hover/click for msg-menu
chatBox.querySelectorAll('.message-bubble').forEach(bubble => {
  const msgMenuEl = row.querySelector('.msg-menu');
  if (msgMenuEl) {
    msgMenuEl.onclick = function (e) {
      e.stopPropagation();
      msgActions.style.display = msgActions.style.display === "flex" ? "none" : "flex";
      // Hide other menus
      chatBox.querySelectorAll('.msg-actions').forEach(other => {
        if (other !== msgActions) other.style.display = "none";
      });
    };
    // Hide when clicking outside
    document.addEventListener('click', function handler(ev) {
      if (!bubble.contains(ev.target)) {
        msgActions.style.display = "none";
        document.removeEventListener('click', handler);
      }
    });
  }
});


function editMessage(msgId) {
  chatRef(selectedSessionId, msgId).once("value", snapshot => {
    const msg = snapshot.val();
    if (!msg) return;
    Swal.fire({
      title: 'Edit your message',
      input: 'text',
      inputValue: msg.message || "",
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value.trim()) return 'Message cannot be empty';
        if (value.trim() === msg.message) return 'No changes made';
      }
    }).then((result) => {
      if (result.isConfirmed && result.value && result.value.trim() !== msg.message) {
        chatRef(selectedSessionId, msgId)
          .update({ message: result.value.trim(), edited: true })
          .then(() => notify("Message edited", { type: "success" }))
          .catch(err => notify("Edit failed: " + err.message, { type: "error" }));
      }
    });
  });
}




function deleteMessage(msgId) {
  Swal.fire({
    title: "Delete this message?",
    text: "Are you sure you want to delete this message?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    background: "#fff0f0",
    color: "#222e3a"
  }).then((result) => {
    if (result.isConfirmed) {
      chatRef(selectedSessionId, msgId).remove()
        .then(() => Swal.fire({
          text: "Message deleted",
          icon: "success",
          background: "#f5fafd",
          color: "#222e3a",
          showConfirmButton: true,
          confirmButtonText: "OK"
        }))
        .catch(err => Swal.fire({
          text: "Failed to delete: " + err.message,
          icon: "error",
          background: "#fff0f0",
          color: "#222e3a",
          showConfirmButton: true,
          confirmButtonText: "OK"
        }));
    }
  });
}



function renderNavProfileAvatar(user) {
  const el = document.getElementById("navProfileAvatar");
  const initials = getInitials(user?.name || "U");
  const bg = getAvatarGradient(user?.name || "");
  el.style.background = bg;
  el.innerHTML = initials;
}

function openProfileModal() {
  // Fill modal fields from current user
  const user = allUserData[currentUserId] || {};
  document.getElementById("profileEditName").value = user.name || "";
  document.getElementById("profileEditEmail").value = user.email || "";
  document.getElementById("profileEditCity").value = user.city || "";
  document.getElementById("profileEditCountry").value = user.country || "IN";
  document.getElementById("profileModal").style.display = "flex";
  document.getElementById("profileModalBackdrop").style.display = "block";
}
function closeProfileModal() {
  document.getElementById("profileModal").style.display = "none";
  document.getElementById("profileModalBackdrop").style.display = "none";
}
// Save and update in Firebase
function saveProfileEdit() {
  const name = document.getElementById("profileEditName").value.trim();
  const email = document.getElementById("profileEditEmail").value.trim();
  const city = document.getElementById("profileEditCity").value.trim();
  const country = document.getElementById("profileEditCountry").value.trim().toUpperCase();
  if (!currentUserId) {
    Swal.fire({ icon: "error", text: "User not logged in" });
    return false;
  }
  db.ref("users/" + currentUserId).update({ name, email, city, country }).then(() => {

    window.ADMIN_PROFILE.avatarUrl = newPhotoUrl; // after upload
    renderAdminSidebarAvatar();
    renderChatMessages(allSessions[selectedSessionId]);

    closeProfileModal();
    notify("Profile updated!", { type: "success" });
    // Rerender avatar with new info
    renderNavProfileAvatar({ name, country });
  }).catch((err) => {
    notify("Error: " + err.message, { type: "error" });
  });
  return false; // Prevent form submit reload
}
// Also close modal on backdrop click:
document.getElementById("profileModalBackdrop").onclick = closeProfileModal;



// --- SIDEBAR: Session List ---
function renderSessions(filter = "") {
  const sessionList = document.getElementById("sessionList");
  sessionList.innerHTML = "";
  const sessionIds = Object.keys(allSessions);

  // 1. Gather and map sessions with metadata
  let sessionArray = sessionIds.map(sid => {
    const chatData = allSessions[sid];
    let lastMsgTime = 0, lastMsgType = "", lastMsgSender = "", lastMsg = "";
    if (chatData) {
      const messagesArr = Object.entries(chatData)
        .map(([msgId, msg]) => ({ ...msg, _id: msgId }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      if (messagesArr.length) {
        const last = messagesArr[messagesArr.length - 1];
        lastMsgTime = last.timestamp || 0;
        lastMsg = last.type === "image" ? "📷 Image" : (last.message || "");
        lastMsgType = last.type;
        lastMsgSender = last.sender;
      }
    }
    return { sid, lastMsgTime, lastMsg, lastMsgType, lastMsgSender };
  });

  window.ADMIN_PROFILE = {
    name: "Admin",
    initials: "A",
    avatarUrl: "images/logo.jpg" // updated when profile changes
  };

  // 2. Apply sorting (uses global sessionSortMode)
  if (sessionSortMode === "latest") {
    sessionArray.sort((a, b) => (b.lastMsgTime || 0) - (a.lastMsgTime || 0));
  } else if (sessionSortMode === "oldest") {
    sessionArray.sort((a, b) => (a.lastMsgTime || 0) - (b.lastMsgTime || 0));
  } else if (sessionSortMode === "az") {
    sessionArray.sort((a, b) => {
      const nameA = (allUserData[a.sid]?.name || "").toLowerCase();
      const nameB = (allUserData[b.sid]?.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } else if (sessionSortMode === "za") {
    sessionArray.sort((a, b) => {
      const nameA = (allUserData[a.sid]?.name || "").toLowerCase();
      const nameB = (allUserData[b.sid]?.name || "").toLowerCase();
      return nameB.localeCompare(nameA);
    });
  }

  let hasResults = false;
  for (let session of sessionArray) {
    const { sid, lastMsg, lastMsgTime, lastMsgSender } = session;
    const userData = allUserData[sid];
    if (!userData || !userData.name) continue;

    // 3. Filter by name or email
    if (filter) {
      const name = (userData.name || "").toLowerCase();
      const email = (userData.email || "").toLowerCase();
      if (!name.includes(filter) && !email.includes(filter)) continue;
    }

    hasResults = true;
    const initials = getInitials(userData.name);
    const avatarGradient = getAvatarGradient(userData.name + (userData.country || "IN"));
    const statusDot = getStatusDotHtml(sid);
    const isSelected = selectedSessionId === sid ? "selected" : "";
    const countryFlag = getCountryFlagImg(userData.country || "IN", 20);

    // 4. Format last message time
    let lastMsgTimeStr = "";
    if (lastMsgTime) {
      const d = new Date(lastMsgTime);
      const now = new Date();
      if (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        lastMsgTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      } else {
        lastMsgTimeStr = d.toLocaleDateString();
      }
    }

    // 5. Notification badge for new/unread messages
    let showBadge = false;
    // Use window.lastViewedTimestamp[sid] logic (see previous answer)
    if (
      lastMsgSender !== "agent" &&
      lastMsgSender !== "admin" &&
      lastMsgTime > (window.lastViewedTimestamp?.[sid] || 0)
    ) {
      showBadge = true;
    }

    // 6. Render each session entry
    const sessionBtn = document.createElement("div");
    sessionBtn.className = `session-item ${isSelected}`;
    sessionBtn.innerHTML = `
      <div style="display:flex;align-items:center;gap:11px;position:relative;">
        <div style="position:relative;width:45px;height:45px;">
          <div class="user-avatar"
            style="width:43px;height:43px;border-radius:50%;background:${avatarGradient};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:1rem;box-shadow:0 1px 8px #15193544; box-shadow: inset 0 1px 20px 2px #00000044;">
            ${escapeHtml(initials)}
             ${statusDot}

          </div>
          <span class="country-flag" style="position: absolute; right: -2px; bottom: -3px;">
            ${countryFlag}
          </span>
          ${showBadge ? `<span class="badge-notification" style="position:absolute;top:-6px;right:-8px;background:#b30400;color:white;border-radius:9px;padding:0 6px;font-size:0.8em;">1</span>` : ""}
        </div>
        <div style="flex:1;min-width:0;">
          <div class="session-name" >
            ${escapeHtml(userData.name)}
          </div>
          <div class="session-info" style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden;color:#656e7e;">
            <span style="display:inline-block;max-width:150px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;">
              ${lastMsg || "<i>No messages yet</i>"}
            </span>
            <span style="color:#a6a6a6;font-size:.8em;float:right;padding-left:8px;">${lastMsgTimeStr}</span>
          </div>
        </div>
      </div>
    `;


sessionBtn.onclick = () => {
  const now = Date.now();
  window.lastViewedTimestamp[sid] = now;
  db.ref("admin_last_seen/" + ADMIN_ID + "/" + sid).set(now);
  loadChat(sid); // Will reset listeners and chatbox!
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
};



    sessionList.appendChild(sessionBtn);
  }

  if (!hasResults) {
    sessionList.innerHTML = '<div class="empty-state">Select Tab</div>';
  }
}

// For each user/session ID:
// db.ref("chats/" + userId)
//   .orderByChild("timestamp")
//   .limitToLast(1)
//   .once("value", function (snapshot) {
//     // Only handle/display the latest message
//   });


function getLastMessage(sessionId, callback) {
db.ref(chatSessionPath(sessionId))
  .orderByChild("timestamp")
  .limitToLast(1)
  .once("value", (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const lastMsg = Object.values(val)[0];
        callback(lastMsg);
      } else {
        callback(null);
      }
    });
}


// Add a status indicator (dot) based on presence
function getStatusDotHtml(userId) {
  const userStatus = window.userPresence?.[userId];
  const state = userStatus?.state || "offline";
  // Define colors for different states
  const color = state === "online" ? "#03d500"   // Green for online
    : state === "away" ? "#fd7b1f"   // Orange for away  
      : "#919191";                          // Grey for offline

  return `<span class="user-status-dot"
    style="
position: absolute;
    bottom: 45px;
    right: 45px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: ${color};
    border: 2px solid white;
    /* box-shadow: 0 0 6px 3px rgba(0, 0, 0, 0.3); */
    z-index: 2;
    "></span>`;
}








// function listenToPresence() {
//   firebase.database().ref("presence").on("value", function(snapshot) {
//     window.userPresence = snapshot.val() || {};
//     renderSessions(document.getElementById("searchInput").value.toLowerCase());
//     renderUserInfoPanel(); // <-- make sure you call this here!
//   });
// }
// listenToPresence();





function getLocationMapLink(city, country, lat, lng) {
  // If latitude & longitude are valid, use them; else fallback to city/country search
  if (lat && lng) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  } else if (city && country) {
    return `https://www.google.com/maps/search/${encodeURIComponent(city + ', ' + country)}`;
  } else if (country) {
    return `https://www.google.com/maps/search/${encodeURIComponent(country)}`;
  } else {
    return "#";
  }
}



// --- USER INFO PANEL ---
function renderUserInfoPanel() {
  const userInfoList = document.getElementById("user-info-list");
  if (!selectedSessionId || !allUserData[selectedSessionId]) {
    userInfoList.innerHTML = "";
    userInfoList.classList.add("hide");
    return;
  }

  userInfoList.classList.remove("hide"); 
  
  const user = allUserData[selectedSessionId];
  const initials = getInitials(user.name);
  const avatarGradient = getAvatarGradient(user.name + (user.country || "IN"));
  const lat = user.location?.latitude || user.latitude;
  const lng = user.location?.longitude || user.longitude;
  const city = user.city || "Users Location";
  const country = user.country || "IN";
  
  const countryFlag = getCountryFlagImg(country, 20);

  // Get user's current status
  const userStatus = window.userPresence?.[selectedSessionId];
  const statusText = userStatus?.state || "offline";
  const statusColor = statusText === "online" ? "#13d157"
    : statusText === "away" ? "#ff9500"
      : "#bbb";

  // Calculate time (for demo, just show current time)
  const now = new Date();
  const localTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const timezoneOffset = Intl.DateTimeFormat().resolvedOptions().timeZone;

  userInfoList.innerHTML = `
    <div class="modern-user-card" id="user-info-${selectedSessionId}">
      <div class="modern-avatar" style="background:${avatarGradient};color:#fff;position:relative;box-shadow:0 3px 10px #15193533; width: 60px;height: 60px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%; box-shadow: inset 0 1px 20px 2px #00000044;">
        ${initials}
        <span class="country-flag" title="${country}" style="position:absolute;right:-8px;bottom:-5px;">
          ${countryFlag}
        </span>
        ${getStatusDotHtml(selectedSessionId)}
      </div>

      <div class="modern-user-details" style="flex:1;">
        <span class="modern-user-name">${escapeHtml(user.name)}</span>
        <span class="modern-user-email">${escapeHtml(user.email || "")}</span>
        <div style="font-size:0.8em;color:${statusColor};font-weight:600;margin-top:2px;display:flex;">
          ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
          <button class="modern-edit-btn" onclick="openEditModal('${selectedSessionId}')">✏️</button>
        </div>
        
      </div>
    </div>
    <!-- Extra user info like in the Jira-style panel -->
    <div style="border-bottom: 1px solid lightgray;">
      <p style="text-align: center;  margin:10px 0px 15px 0; width: 250px;font-weight: 700; color:rgb(138, 138, 138);font-size: 1.3rem;">Users Information</p>
    </div>
    <div class="modern-user-extra">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">📧</span>
        <span style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis; color:rgb(0, 142, 2);">${escapeHtml(user.email || "")}</span>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
  📍<span>
    ${
      isValidLocation(lat, lng)
        ? `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="color:rgb(255, 0, 0); text-decoration: none; font-size: .9em; padding-left: 3.5px;">
              ${city}, ${country}
           </a>`
        : `<span style="color: #e53935; font-weight: 600; font-size: .9em; padding-left:5px; ">Location not available</span>`
    }
  </span>
  
</div>

      <div class="time-date" style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">🕒</span>
        <span>${localTime} <span style="color:#7a8599;font-size:.8em;">(${timezoneOffset})</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
        <span style="font-size:1.2em;">🌍</span>
        <span>${countryFlag}</span>
      </div>
      <div class="time-date" style="display:flex;align-items:center;gap:12px;margin-bottom:9px;">
        <span style="font-size:1.3em;">📆</span>
        <span>${getFormattedDateByTimezone()}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:35px;">
        <span style="font-size:1.2em;">📊</span>
        <span style="color:${statusColor};font-weight:600; padding-left:3px;">Status: ${statusText}</span>
      </div>
    </div>
  `;
}

function getFormattedDateByTimezone(timezone = "Asia/Kolkata") {
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone
  });
}

// Place updateMessageStatusUI here!
function updateMessageStatusUI(msgId, msgData) {
  const bubble = document.querySelector(`[data-msg-id="${msgId}"]`);
  if (!bubble) return;
  const meta = bubble.querySelector('.msg-meta');
  if (!meta) return;
  const timeText = meta.textContent.split('✔')[0].trim();
  meta.innerHTML = timeText + ' ' + getMessageStatusIcon(msgData,
    (msgData.sender || '').toLowerCase() === "admin" ||
    (msgData.sender || '').toLowerCase() === "agent" ||
    (msgData.sender || '').toLowerCase() === "bot"
  );
}



function setUserPresence(userId) {
  const presenceRef = firebase.database().ref("presence/" + userId);
  const amOnline = { state: "online", last_changed: firebase.database.ServerValue.TIMESTAMP };
  const amOffline = { state: "offline", last_changed: firebase.database.ServerValue.TIMESTAMP };

  // Special Firebase ref: triggers when connection state changes
  const connectedRef = firebase.database().ref(".info/connected");

  connectedRef.on("value", function (snapshot) {
    if (snapshot.val() === true) {
      // Set offline on disconnect
      presenceRef.onDisconnect().set(amOffline).then(function () {
        // Set online now
        presenceRef.set(amOnline);
      });
    }
  });

  // Optionally, mark offline when browser closes (extra safe)
  window.addEventListener("beforeunload", () => {
    presenceRef.set(amOffline);
  });
}

function showUserInfoSection(show) {
  const userInfoSection = document.getElementById("user-info-list");
  const chatArea = document.querySelector(".chat-area");

  if (show) {
    userInfoSection.classList.remove("hide");
    chatArea.classList.remove("full-chat");
  } else {
    userInfoSection.classList.add("hide");
    chatArea.classList.add("full-chat");
    userInfoSection.innerHTML = ""; // Optionally clear content
  }
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
    Swal.fire({ icon: "warning", text: "Name and Email are required" });
    return;
  }

  // Prepare user data with nested location object
  const userData = {
    name, 
    email,
    location: {
      latitude: latitude || "",
      longitude: longitude || ""
    }
  };

  userRef(sessionId).update(userData)
    .then(() => {
      Swal.fire({
        text: "User profile updated!",
        icon: "success",
        showConfirmButton: true,
        confirmButtonText: "OK",
        position: 'center',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: "#f5fafd",
        color: "#222e3a"
      });

      closeModal();
      window.newProfilePicData = undefined; // Reset
    })
    .catch((err) => {
      notify("Failed to update user profile: " + err.message, { type: "error" });
    });
}



function markMessagesAsRead(sessionId, currentUserType) {
  const messagesRef = db.ref(chatSessionPath(sessionId));
  messagesRef.once("value", (snapshot) => {
    const messages = snapshot.val() || {};
    Object.entries(messages).forEach(([msgId, msg]) => {
      // Only mark as read if not already, and not sent by this user
      if (
        msg.sender !== currentUserType &&
        msg.status !== "read"
      ) {
        db.ref(chatMessagePath(sessionId, msgId)).update({ status: "read" });
      }
    });
  });
}


// For example, when chat loads for the user
markAllAdminMessagesAsRead(selectedSessionId);

function markAllAdminMessagesAsRead(sessionId) {
  const messagesRef = db.ref(chatSessionPath(sessionId));
  messagesRef.once("value", (snapshot) => {
    const messages = snapshot.val() || {};
    Object.entries(messages).forEach(([msgId, msg]) => {
      const sender = (msg.sender || "").toLowerCase();
      if (
        (sender === "admin" || sender === "bot" || sender === "agent") &&
        msg.status !== "read"
      ) {
        db.ref(chatMessagePath(sessionId, msgId)).update({ status: "read" });
      }
    });
  });
}




const ADMIN_PROFILE = {
  name: "Admin",
  initials: "A",
  avatarUrl: "images/logo.jpg" // Default avatar image
};

function renderAdminSidebarAvatar() {
  const avatarContainer = document.getElementById("navAdminProfile");
  const img = new Image();
  img.src = ADMIN_PROFILE.avatarUrl;
  img.onload = function () {
    const dot = getStatusDotHtml(window.currentUserId || ""); // YOUR OWN STATUS
    avatarContainer.innerHTML = `
      <div style="position:relative;">
        <div class="sidebar-admin-avatar">
          <img src="${ADMIN_PROFILE.avatarUrl}" alt="Admin" style="width:100%; height:100%; border-radius:50%;" />
        </div>
        ${dot}
      </div>`;
  };
  img.onerror = function () {
    avatarContainer.innerHTML = `<div class="sidebar-admin-avatar">${ADMIN_PROFILE.initials}</div>`;
  };
}




renderAdminSidebarAvatar();

function attachReplyButtonHandlers(chatBox) {
  chatBox.querySelectorAll('.reply-btn').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      const msgBubble = chatBox.querySelector(`.message-bubble[data-msg-id="${msgId}"]`);
      const msgContent = msgBubble.querySelector('.msg-content').innerText;
      const msgSender = msgBubble.parentElement.classList.contains('self') ? "You" : "User";
      replyToMsg = { id: msgId, content: msgContent, sender: msgSender };
      showReplyPreview();
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
      document.getElementById("msgInput").focus();
    };
  });
}

function attachMessageHandlers(row, chatBox) {
  // Menu toggle
  const msgMenuEl = row.querySelector('.msg-menu');
  if (msgMenuEl) {
    msgMenuEl.onclick = function (e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
      const actions = row.querySelector(`.msg-actions[data-msg-id="${msgId}"]`);
      if (actions) actions.style.display = "flex";
    };
  }
  // Reply
  const replyBtn = row.querySelector('.reply-btn');
if (replyBtn) {
  replyBtn.onclick = function(e) {
    e.stopPropagation();
    const msgId = this.getAttribute('data-msg-id');
    const msgBubble = row.querySelector(`.message-bubble[data-msg-id="${msgId}"]`);
    // For images, msg-content may be empty so handle accordingly:
    let msgContent = "";
    const contentEl = msgBubble.querySelector('.msg-content');
    if (contentEl) {
      msgContent = contentEl.innerText || contentEl.textContent || "";
    } else {
      // Try to get <img> src
      const imgEl = msgBubble.querySelector('img');
      if (imgEl) msgContent = imgEl.src;
    }
    const msgSender = msgBubble.parentElement.classList.contains('self') ? "You" : "User";
    replyToMsg = { id: msgId, content: msgContent, sender: msgSender };
    if (typeof showReplyPreview === "function") showReplyPreview();
    chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    document.getElementById("msgInput").focus();
  };
}

  // Edit
  const editBtn = row.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.onclick = function(e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      editMessage(msgId);
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  }
  // Delete
  const deleteBtn = row.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.onclick = function(e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      deleteMessage(msgId);
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  }
  // Copy
  const copyBtn = row.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.onclick = function(e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      const msgContent = row.querySelector('.msg-content').textContent || "";
      navigator.clipboard.writeText(msgContent).then(() => {
        Swal.fire({
          text: "Message copied!",
          icon: "info",
          showConfirmButton: true,
          confirmButtonText: "OK",
          timer: 2000,
          timerProgressBar: true,
          background: "#f5fafd",
          color: "#222e3a"
        });
      });
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  }
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
    const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const day = dateObj.toLocaleDateString();
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // FIX: Now includes bot as right side
    let senderType = (msg.sender || "").toLowerCase();
    let isRight = senderType === "admin" || senderType === "agent" || senderType === "bot";
    let avatarHtml = "";

    if (isRight) {
      // Bot/Admin/Agent avatar
      avatarHtml = `<div class="message-avatar" style="padding:2px;background:#fff; ">
      <img src="${window.ADMIN_PROFILE.avatarUrl}" alt="Bot/Admin" style="width:32px;height:32px;border-radius:50%;" />
    </div>`;
    } else if (isRight) {
      // === ADMIN/AGENT AVATAR ===
      if (window.ADMIN_PROFILE && window.ADMIN_PROFILE.avatarUrl) {
        avatarHtml = `<div class="message-avatar" style="padding:2px;background:#fff;">
      <img src="${window.ADMIN_PROFILE.avatarUrl}" alt="Admin" style="width:32px;height:32px;border-radius:50%;" />
    </div>`;
      } else {
        avatarHtml = `<div class="message-avatar" style="background:#2563eb;color:#fff;">A</div>`;
      }
    } else {
      // === USER AVATAR ===
      const userData = allUserData[selectedSessionId] || {};
      if (userData.profilePic) {
        avatarHtml = `<div class="message-avatar" style="padding:2px;background:#fff;">
      <img src="${userData.profilePic}" alt="User" style="width:32px;height:32px;border-radius:50%;" />
    </div>`;
      } else {
        let name = userData.name || msg.sender || "";
        let initials = getInitials(name);
        let avatarColor = getAvatarGradient(name + (userData.country || "IN"));
        avatarHtml = `<div class="message-avatar" style="background:${avatarColor};color:#fff;">${initials}</div>`;
      }
    }
    // Message Content
    let messageContent = "";
    let bubbleStyle = '';
    let replyHtml = "";
if (msg.reply) {
  if (msg.reply.content && msg.reply.content.startsWith("data:image")) {
    replyHtml = `
      <div class="msg-reply-ref" style="margin-bottom: 2px; padding: 4px 8px; background: #f5f7fa; border-radius: 6px; font-size: 0.92em; color: #666;">
        <b>${msg.reply.sender} replied to image:</b><br>
        <img src="${escapeHtml(msg.reply.content)}" alt="image" style="max-width:60px;max-height:45px;border-radius:4px;margin-top:2px;">
      </div>`;
  } else {
    replyHtml = `
      <div class="msg-reply-ref" style="margin-bottom: 2px; padding: 4px 8px; background: #a2a2a2; border-radius: 6px; font-size: 0.92em; color: #666;">
        <b>${msg.reply.sender}:</b> ${escapeHtml(msg.reply.content)}
      </div>`;
  }
}


if (msg.type === "image" && msg.message) {
  // Already an image upload via base64
  messageContent = `<img src="${escapeHtml(msg.message)}" alt="image" class="chat-img"
    style="cursor:zoom-in;max-width:130px;max-height:100px;border-radius:10px;" />`;
  bubbleStyle = "background:transparent;padding:6px 10px 3px 10px;box-shadow:none;border:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;";
} else if (isImageUrl(msg.message)) {
  // If the message is just an image URL, treat as image!
  messageContent = `<img src="${escapeHtml(msg.message)}" alt="image" class="chat-img"
    style="cursor:zoom-in;max-width:130px;max-height:100px;border-radius:10px;" />`;
  bubbleStyle = "background:transparent;padding:6px 10px 3px 10px;box-shadow:none;border:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;";
} else {
  // Normal text
  messageContent = escapeHtml(msg.message || "");
  if (isRight) {
    bubbleStyle = "background:#fff;color:#2563eb;";
  } else {
    bubbleStyle = "background: #2563eb;";
  }
}



    // Message bubble HTML
    // At the top of your .forEach((msg) => { ... })
    const canEditDelete = senderType === "admin" || senderType === "agent" || senderType === "bot"; // or whatever logic you want

    // Message bubble HTML, add 3-dot menu if right-side (admin/bot/agent), can do for user too if desired
    chatBox.innerHTML += `
  <div class="message-row ${isRight ? "self" : senderType}" style="position:relative;">
    ${!isRight ? avatarHtml : ""}
    <div class="message-bubble" style="${bubbleStyle}position:relative;" data-msg-id="${msg._id}">
    ${replyHtml}
      <div class="msg-content">${messageContent}</div>
      <div class="msg-meta">${timeString} ${getMessageStatusIcon(msg, isRight)}</div>
      <span class="msg-menu" title="More" data-msg-id="${msg._id}">⋮</span>
      <div class="msg-actions" data-msg-id="${msg._id}" style="display:none;">
        <button class="reply-btn" data-msg-id="${msg._id}" title="Reply">Reply</button>
        <button class="edit-btn" data-msg-id="${msg._id}" title="Edit">Edit</button>
        <button class="delete-btn" data-msg-id="${msg._id}" title="Delete">Delete</button>
        <button class="copy-btn" data-msg-id="${msg._id}" title="Copy">Copy</button>
      </div>
    </div>
    ${isRight ? avatarHtml : ""}
  </div>
`;
  });

// Create the overlay if not already present (best: after DOMContentLoaded)
if (!document.getElementById('chat-preview-fullscreen-overlay')) {
  const overlay = document.createElement('div');
  overlay.id = 'chat-preview-fullscreen-overlay';
  overlay.style = `
    display:none; position:fixed; left:0;top:0;width:100vw;height:100vh;z-index:2147483647;
    background:rgba(15,20,40,0.92); justify-content:center;align-items:center;cursor:zoom-out;
  `;
  overlay.innerHTML = `<img src="" style="max-width:96vw;max-height:96vh;border-radius:16px;box-shadow:0 6px 64px #000a;background:#fff;">`;
  document.body.appendChild(overlay);

  // Hide on overlay click (outside image)
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      overlay.querySelector('img').src = '';
    }
  };
}


let replyToMsg = null;
function showReplyPreview() {
  if (!replyToMsg) return;
  document.getElementById("replyPreviewSender").innerText = replyToMsg.sender + ":";
  document.getElementById("replyPreviewMsg").innerText = replyToMsg.content;
  document.getElementById("replyPreview").style.display = "block";
}
window.showReplyPreview = showReplyPreview;



document.getElementById("cancelReplyBtn").onclick = function() {
  replyToMsg = null;
  document.getElementById("replyPreview").style.display = "none";
};


// Add handler for Reply buttons
chatBox.querySelectorAll('.message-row').forEach(row => {
  attachMessageHandlers(row, chatBox);
});



// Attach this ONCE, not in every render!
document.addEventListener('click', function(e) {
  // Only trigger for .chat-img (images in chat bubbles)
  if (e.target && e.target.classList.contains('chat-img')) {
    const overlay = document.getElementById('chat-fullscreen-image-overlay');
    overlay.querySelector('img').src = e.target.src;
    overlay.style.display = 'flex';
    overlay.classList.add('active');
  }
});

// Hide overlay when clicking the dark area
document.getElementById('chat-fullscreen-image-overlay').onclick = function(e) {
  if (e.target === this) {
    this.style.display = 'none';
    this.classList.remove('active');
    this.querySelector('img').src = '';
  }
};



function showChatImageFullscreen(src) {
  const overlay = document.getElementById('chat-preview-fullscreen-overlay');
  if (!overlay) return;
  if (overlay.style.display === 'flex' && overlay.querySelector('img').src === src) return;
  overlay.querySelector('img').src = src;
  overlay.style.display = 'flex';
}



  setTimeout(() => {
  chatBox.scrollTop = chatBox.scrollHeight;
}, 0);

  chatBox.querySelectorAll('.msg-menu').forEach(menu => {
    menu.onclick = function (e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
      const actions = chatBox.querySelector(`.msg-actions[data-msg-id="${msgId}"]`);
      if (actions) actions.style.display = "flex";
    };
  });

  // Edit
  chatBox.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      editMessage(msgId);
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  });

  // Delete
  chatBox.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      deleteMessage(msgId);
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  });

  // Copy
  chatBox.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = function (e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      const msgContent = chatBox.querySelector(`.message-bubble[data-msg-id="${msgId}"] .msg-content`).textContent || "";
      navigator.clipboard.writeText(msgContent).then(() => {
        Swal("Message copied!", { type: "success" });
      });
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  });

  // Hide all menus if clicking outside
  document.addEventListener('click', function outsideClickHandler(e) {
    chatBox.querySelectorAll('.msg-actions').forEach(actions => {
      actions.style.display = "none";
    });
    // Remove this handler after run to avoid stacking
    document.removeEventListener('click', outsideClickHandler);
  });

}

// Re-attach menu listeners
// After chatBox.innerHTML += ... (i.e., after building all messages)
// Add event listeners to msg-menu buttons
// Attach menu toggle


// --- Chat selection & loading ---
function updateSingleMessage(msg, msgId, chatBox, messagesMap) {
  // Remove old bubble
  const oldRow = chatBox.querySelector(`[data-msg-id="${msgId}"]`);
  if (oldRow) oldRow.remove();
  // Re-render the updated message
  renderSingleMessage(msg, msgId, chatBox, messagesMap);
}


let currentChatListeners = {};
let messagesMap = {};

// Only mark as read when the chat window is focused AND the current chat is open
function handleChatVisibility() {
  if (!selectedSessionId) return;

}

// Listen for visibility change (tab change/minimize)
document.addEventListener("visibilitychange", handleChatVisibility);


function loadChat(sessionId) {
  detachChatListeners();  
  selectedSessionId = sessionId;

  // Use selectedWebsiteKey
  // const chatRefObj = db.ref(`chats/${selectedWebsiteKey}/${sessionId}`);

  // Dynamically pick the path based on selectedWebsiteKey!

 



  // Remove old listeners if present (defensive: skip if not set)
  if (typeof currentChatListeners !== "object") currentChatListeners = {};
  if (currentChatListeners.added) chatRef.off("child_added", currentChatListeners.added);
  if (currentChatListeners.changed) chatRef.off("child_changed", currentChatListeners.changed);
  if (currentChatListeners.removed) chatRef.off("child_removed", currentChatListeners.removed);

  // Initialize message map and clear UI
  messagesMap = {};
  const chatBox = document.getElementById('chatBox');
  chatBox.innerHTML = "";

  // Add listeners to the correct chatRef!
  currentChatListeners.added = chatRef(selectedSessionId).on("child_added", snapshot => {
  const msg = snapshot.val();
  const msgId = snapshot.key;
  messagesMap[msgId] = { ...msg, _id: msgId };
  renderSingleMessage(msg, msgId, chatBox, messagesMap);
});

currentChatListeners.changed = chatRef(selectedSessionId).on("child_changed", snapshot => {
  const updatedMsg = snapshot.val();
  const msgId = snapshot.key;
  updateMessageStatusUI(msgId, updatedMsg);

  // Update text in the UI if message changed
  const msgBubble = document.querySelector(`.message-bubble[data-msg-id="${msgId}"] .msg-content`);
  if (msgBubble && updatedMsg.message !== undefined) {
    msgBubble.textContent = updatedMsg.message;
    if (updatedMsg.edited) {
      msgBubble.innerHTML += ' <span style="font-size:11px;color:#888;">(edited)</span>';
    }
  }
});

currentChatListeners.removed = chatRef(selectedSessionId).on("child_removed", snapshot => {
  const msgId = snapshot.key;
  const bubble = document.querySelector(`.message-bubble[data-msg-id="${msgId}"]`);
  if (bubble) bubble.parentElement.remove();
});


  // Update message (edit)
  // currentChatListeners.changed = chatRef.on("child_changed", snapshot => {
  //   const msg = snapshot.val();
  //   const msgId = snapshot.key;
  //   messagesMap[msgId] = { ...msg, _id: msgId };
  //   updateSingleMessage(msg, msgId, chatBox, messagesMap);
  // });

  // Remove message (delete)
  currentChatListeners.removed = db.ref(
    (selectedWebsiteKey === "einvite")
      ? "chats/" + selectedSessionId
      : "chats/" + selectedWebsiteKey + "/" + selectedSessionId
  ).on("child_removed", snapshot => {
    const msgId = snapshot.key;
    delete messagesMap[msgId];
    removeSingleMessage(msgId, chatBox);
  });


  renderUserInfoPanel();
  document.getElementById("inputGroup").style.display = "flex";
  // Mark all user messages as read when admin opens the chat
  if (document.visibilityState === "visible") {
    markMessagesAsRead(sessionId, "admin");
  }


}


function renderSingleMessage(msg, msgId, chatBox, messagesMap) {
  // Prevent duplicates
  if (chatBox.querySelector(`[data-msg-id="${msgId}"]`)) return;

  // Message meta
  const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  let senderType = (msg.sender || "").toLowerCase();
  let isRight = senderType === "admin" || senderType === "agent" || senderType === "bot";
  let avatarHtml = "";

  if (isRight) {
    avatarHtml = `<div class="message-avatar" style="padding:2px;background:#fff;">
      <img src="${window.ADMIN_PROFILE.avatarUrl}" alt="Bot/Admin" style="width:32px;height:32px;border-radius:50%;" />
    </div>`;
  } else {
    const userData = allUserData[selectedSessionId] || {};
    if (userData.profilePic) {
      avatarHtml = `<div class="message-avatar" style="padding:2px;background:#fff;">
        <img src="${userData.profilePic}" alt="User" style="width:32px;height:32px;border-radius:50%;" />
      </div>`;
    } else {
      let name = userData.name || msg.sender || "";
      let initials = getInitials(name);
      let avatarColor = getAvatarGradient(name + (userData.country || "IN"));
      avatarHtml = `<div class="message-avatar" style="background:${avatarColor};color:#fff; font-size: 12px;">${initials}</div>`;
    }
  }

  let messageContent = "";
  let bubbleStyle = '';
  let replyHtml = "";
if (msg.reply) {
  if (msg.reply.content && msg.reply.content.startsWith("data:image")) {
    replyHtml = `
      <div class="msg-reply-ref">
        <b>${msg.reply.sender} replied to image:</b><br>
        <img src="${escapeHtml(msg.reply.content)}" alt="image" style="max-width:60px;max-height:45px;border-radius:4px;margin-top:2px;">
      </div>`;
  } else {
    replyHtml = `
      <div class="msg-reply-ref">
        <b>${msg.reply.sender}:</b> ${escapeHtml(msg.reply.content)}
      </div>`;
  }
}


if (msg.type === "image" && msg.message) {
  // Already an image upload via base64
  messageContent = `<img src="${escapeHtml(msg.message)}" alt="image" class="chat-img"
    style="cursor:zoom-in;max-width:130px;max-height:100px;border-radius:10px;" />`;
  bubbleStyle = "background:transparent;padding:6px 10px 3px 10px;box-shadow:none;border:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;";
} else if (isImageUrl(msg.message)) {
  // If the message is just an image URL, treat as image!
  messageContent = `<img src="${escapeHtml(msg.message)}" alt="image" class="chat-img"
    style="cursor:zoom-in;max-width:130px;max-height:100px;border-radius:10px;" />`;
  bubbleStyle = "background:transparent;padding:6px 10px 3px 10px;box-shadow:none;border:none;display:flex;flex-direction:column;align-items:flex-start;gap:2px;";
} else {
  // Normal text
  messageContent = escapeHtml(msg.message || "");
  if (isRight) {
    bubbleStyle = "background:#fff;color:#2563eb;";
  } else {
    bubbleStyle = "background: #2563eb;";
  }
}



  // Build the whole row
  const row = document.createElement("div");
  row.className = `message-row ${isRight ? "self" : senderType}`;
  row.setAttribute("data-msg-id", msgId);
  if (msg.type === "image" && msg.message) {
  row.innerHTML += `
    <div class="message-row ${isRight ? "self" : senderType}" style="position:relative;width: 400px;">
      ${!isRight ? avatarHtml : ""}
      <div class="message-bubble image-bubble" data-msg-id="${msg._id}" style="position:relative;display:inline-block;box-shadow:none; padding: 5px !important;">
        <img src="${escapeHtml(msg.message)}" alt="image" class="chat-img"
           style="display:block;max-width:130px;max-height:100px;border-radius:10px;box-shadow:0 2px 8px #2563eb12;cursor:zoom-in;" />
        <span class="msg-menu" title="More" data-msg-id="${msg._id}">⋮</span>
        <div class="msg-actions" data-msg-id="${msg._id}" style="display:none;">
          <button class="reply-btn" data-msg-id="${msg._id}" title="Reply">Reply</button>
          <button class="edit-btn" data-msg-id="${msg._id}" title="Edit">Edit</button>
          <button class="delete-btn" data-msg-id="${msg._id}" title="Delete">Delete</button>
          <button class="copy-btn" data-msg-id="${msg._id}" title="Copy">Copy</button>
        </div>
        <div class="msg-meta" style="text-align:right;margin-top:2px;font-size:0.92em;">${timeString} ${getMessageStatusIcon(msg, isRight)}</div>
      </div>
      ${isRight ? avatarHtml : ""}
    </div>
  `;
} else {
  // ADD REPLY BUTTON HERE TOO!
  row.innerHTML = `
    ${!isRight ? avatarHtml : ""}
    <div class="message-bubble" style="${bubbleStyle}position:relative;" data-msg-id="${msgId}">
    ${replyHtml}
      <div class="msg-content">${messageContent}</div>
      <div class="msg-meta">${timeString} ${getMessageStatusIcon(msg, isRight)}</div>
      <span class="msg-menu" title="More" data-msg-id="${msgId}">⋮</span>
      <div class="msg-actions" data-msg-id="${msgId}" style="display:none;">
        <button class="reply-btn" data-msg-id="${msgId}" title="Reply">Reply</button>
        <button class="edit-btn" data-msg-id="${msgId}" title="Edit">Edit</button>
        <button class="delete-btn" data-msg-id="${msgId}" title="Delete">Delete</button>
        <button class="copy-btn" data-msg-id="${msgId}" title="Copy">Copy</button>
      </div>
    </div>
    ${isRight ? avatarHtml : ""}
  `;
}



  // --- Event Listeners (same as before) ---
  // Menu
  // Menu
  const msgMenuEl = row.querySelector('.msg-menu');
  if (msgMenuEl) {
    msgMenuEl.onclick = function (e) {
      e.stopPropagation();
      const msgId = this.getAttribute('data-msg-id');
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
      const actions = row.querySelector(`.msg-actions[data-msg-id="${msgId}"]`);
      if (actions) actions.style.display = "flex";
    };
  }
  // Edit
  const editBtnEl = row.querySelector('.edit-btn');
  if (editBtnEl) {
    editBtnEl.onclick = function (e) {
      e.stopPropagation();
      editMessage(msgId);
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  }
  // Delete
  const deleteBtnEl = row.querySelector('.delete-btn');
  if (deleteBtnEl) {
    deleteBtnEl.onclick = function (e) {
      e.stopPropagation();
      deleteMessage(msgId);
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  }
  // Copy
  const copyBtnEl = row.querySelector('.copy-btn');
  if (copyBtnEl) {
    copyBtnEl.onclick = function (e) {
      e.stopPropagation();
      const msgContent = row.querySelector('.msg-content').textContent || "";
      navigator.clipboard.writeText(msgContent).then(() => {
        Swal.fire({
          text: "Message copied!",
          icon: "info",
          showConfirmButton: true,
          confirmButtonText: "OK",
          position: 'center',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: "#f5fafd",
          color: "#222e3a"
        });
      });
      chatBox.querySelectorAll('.msg-actions').forEach(a => a.style.display = "none");
    };
  }

  // Hide all menus on outside click
  document.addEventListener('click', function outsideClickHandler(e) {
    chatBox.querySelectorAll('.msg-actions').forEach(actions => {
      actions.style.display = "none";
    });
    document.removeEventListener('click', outsideClickHandler);
  });

  // --- Append and scroll ---
chatBox.appendChild(row);
attachMessageHandlers(row, chatBox);
setTimeout(() => {
  chatBox.scrollTop = chatBox.scrollHeight;
}, 0);



}

(function(){
  // 1. Try to detect dark mode from website (standard ways)
  function isDarkTheme() {
    // Most sites use class on <html> or <body>, but never touch them!
    // Check for [data-theme], [class*="dark"], or forced by prefers-color-scheme
    const html = document.documentElement;
    if (html.getAttribute('data-theme') === 'dark') return true;
    if (html.className && html.className.toLowerCase().includes('dark')) return true;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    // Try common container classes
    if (document.body.className && document.body.className.toLowerCase().includes('dark')) return true;
    return false;
  }

  // 2. Toggle theme for your widget only
  function setChatbotTheme(dark) {
    var container = document.getElementById('chat-container') || document.getElementById('chatbot-chat-container');
    if (!container) return;
    if (dark) {
      container.classList.add('chatbot-dark');
    } else {
      container.classList.remove('chatbot-dark');
    }
  }

  // 3. Initial apply
  setChatbotTheme(isDarkTheme());

  // 4. Auto-adapt if website theme changes
  // Listen for system/website theme changes (prefers-color-scheme)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    setChatbotTheme(e.matches);
  });

  // (Advanced) Listen for mutations to html/body class/data-theme
  var obs = new MutationObserver(function(){
    setChatbotTheme(isDarkTheme());
  });
  obs.observe(document.documentElement, { attributes:true, attributeFilter:['class','data-theme'] });
  obs.observe(document.body, { attributes:true, attributeFilter:['class','data-theme'] });
})();


// Update message (on edit)
// Real-time all chats and all users
// db.ref("chats").on("value", (snapshot) => {
//   allSessions = snapshot.val() || {};
//   renderSessions(document.getElementById("searchInput").value.toLowerCase());
//   // Optionally, reload chat panel if current session changed (avoid flicker)
//   if (selectedSessionId && allSessions[selectedSessionId]) {
//     // Force refresh messages
//     renderChatMessages(allSessions[selectedSessionId]);
//   }
// });

db.ref("users").on("value", (snapshot) => {
  allUserData = snapshot.val() || {};
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  if (selectedSessionId) renderUserInfoPanel();
});


// Remove message (on delete)
function removeSingleMessage(msgId, chatBox) {
  // Find the message DOM node with the matching msgId
  const msgEl = chatBox.querySelector(`[data-msg-id="${msgId}"]`);
  if (msgEl) msgEl.remove(); // Remove it from the UI
}



// When preview image is clicked, show fullscreen overla

// Hide overlay on click outside image
document.getElementById('chat-preview-fullscreen-overlay').onclick = function(e) {
  if (e.target === this) {
    this.style.display = 'none';
    this.querySelector('img').src = '';
  }
};






// --- Firebase listeners ---
function initializeApp() {
  Promise.all([
    db.ref("chats").once("value"),
    db.ref("users").once("value"),
    db.ref("status").once("value")
  ]).then(([chatsSnap, usersSnap, statusSnap]) => {
    allSessions = chatsSnap.val() || {};
    allUserData = usersSnap.val() || {};
    window.userPresence = statusSnap.val() || {};

    console.log('Initial data loaded:', {
      sessions: Object.keys(allSessions).length,
      users: Object.keys(allUserData).length,
      presence: Object.keys(window.userPresence).length
    });

    // Initialize presence tracking for all users
    initializePresenceTracking();

    // Render initial UI
    renderSessions(document.getElementById("searchInput").value.toLowerCase());
    renderUserInfoPanel();
  }).catch(error => {
    console.error('Error initializing app:', error);
  });
}

function debugUserPresence() {
  console.log('Current userPresence data:', window.userPresence);
  console.log('Selected session ID:', selectedSessionId);
  if (selectedSessionId) {
    console.log('Selected user presence:', window.userPresence?.[selectedSessionId]);
  }
}



window.addEventListener('load', initializeApp);

// --- Send message ---
// --- Send message ---
document.getElementById("sendBtn").onclick = () => {
  const msgInput = document.getElementById("msgInput");
  const msg = msgInput.value.trim();
  if (!msg || !selectedSessionId) return;
  const messageData = {
    sender: "agent",
    message: msg,
    type: "text",
    timestamp: Date.now(),
    status: "sent"
  };
  if (replyToMsg) {
    messageData.reply = {
      id: replyToMsg.id,
      sender: replyToMsg.sender,
      content: replyToMsg.content
    };
    // Clear reply state
    replyToMsg = null;
    document.getElementById("replyPreview").style.display = "none";
  }
  chatRef(selectedSessionId).push(messageData);
  msgInput.value = "";
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
    Swal.fire({
      text: "Only image files are allowed.",
      icon: "warning",
      background: "#f5fafd",
      color: "#222e3a",
      showConfirmButton: true,
      confirmButtonText: "OK"
    });
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    Swal.fire({
      title: "Send this image?",
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <img id="swal-image-preview" src="${e.target.result}" alt="Preview" style="max-width:260px;max-height:200px;border-radius:10px;box-shadow:0 2px 18px #2563eb15; margin-bottom:18px;cursor:zoom-in;" />
          <div style="margin-top:8px;color:#5a5a5a;font-size:.97em;">Are you sure you want to send this image to the user?</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
      background: "#fff",
      color: "#222e3a",
      customClass: {
        confirmButton: 'save-btn',
        cancelButton: 'swal2-cancel-btn'
      },
      didOpen: () => {
        // Add fullscreen overlay logic
        const img = document.getElementById('swal-image-preview');
        if (img) {
          img.onclick = function () {
            let overlay = document.getElementById('chat-preview-fullscreen-overlay');
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.id = 'chat-preview-fullscreen-overlay';
              overlay.style = `
                display:flex; position:fixed; left:0;top:0;width:100vw;height:100vh;z-index:2147483647;
                background:rgba(15,20,40,0.92); justify-content:center;align-items:center;cursor:zoom-out;
              `;
              overlay.innerHTML = `<img src="" style="max-width:96vw;max-height:96vh;border-radius:16px;box-shadow:0 6px 64px #000a;background:#fff;">`;
              document.body.appendChild(overlay);
            }
            overlay.querySelector('img').src = img.src;
            overlay.style.display = 'flex';
            overlay.onclick = function(e) {
              if (e.target === overlay) {
                overlay.style.display = 'none';
                overlay.querySelector('img').src = '';
              }
            };
          };
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const messageData = {
          sender: "agent",
          message: e.target.result,
          type: "image",
          timestamp: Date.now(),
          status: "sent"
        };
        chatRef(selectedSessionId).push(messageData);
        fileInput.value = "";
      } else {
        fileInput.value = "";
      }
    });
  };
  reader.readAsDataURL(file);
};

// Add this only ONCE in your JS!
function ensureImageOverlay() {
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
}
ensureImageOverlay();


// --- Modal close on background click ---
document.getElementById("modalBackdrop").onclick = closeModal;

// --- Search filter ---
document.getElementById("searchInput").addEventListener('input', function () {
  renderSessions(this.value.toLowerCase());
});

// Make saveUserEdit globally available (for modal)
window.saveUserEdit = saveUserEdit;
window.openEditModal = openEditModal;
window.closeModal = closeModal;

window.closeChatOnMobile = function () {
  selectedSessionId = null;
  document.querySelector('.sidebar').classList.remove('mobile-hide');
  document.getElementById('mobileBackBtn').style.display = "none";
  // Hide chat
  document.getElementById('chatBox').innerHTML = `
    <div class="empty-state">
      <h3>Select a chat to view messages</h3>
      <p>Choose a session from the sidebar to start viewing the conversation</p>
    </div>
  `;
  document.getElementById("inputGroup").style.display = "none";
  renderSessions(document.getElementById("searchInput").value.toLowerCase());
  renderUserInfoPanel();
}

window.addEventListener("resize", function () {
  if (window.innerWidth > 700) {
    document.querySelector('.sidebar').classList.remove('mobile-hide');
    document.getElementById('mobileBackBtn').style.display = "none";
  } else if (selectedSessionId) {
    document.querySelector('.sidebar').classList.add('mobile-hide');
    document.getElementById('mobileBackBtn').style.display = "flex";
  }
});



document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && selectedSessionId) {
    markMessagesAsRead(selectedSessionId, "admin");
  }
});

document.addEventListener('click', function(e) {
  // This closes all open msg-actions if you click anywhere except the menu or cross button
  if (
    !e.target.classList.contains('msg-menu') &&
    !e.target.closest('.msg-actions')
  ) {
    document.querySelectorAll('.msg-actions').forEach(menu => menu.style.display = 'none');
  }
});

document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('chat-img')) {
    const overlay = document.getElementById('chat-preview-fullscreen-overlay');
    if (!overlay) return;
    overlay.querySelector('img').src = e.target.src;
    overlay.style.display = 'flex';
  }
});


// --- DARK/LIGHT THEME TOGGLE LOGIC ---

const THEME_KEY = "agent_panel_theme";
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-toggle-icon");
const themeLabel = document.getElementById("theme-toggle-label");

// Utility to apply theme
function setTheme(mode) {
  const isDark = mode === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  // Swap icon/label
  if (isDark) {
    themeIcon.textContent = "☀️";
    themeLabel.textContent = "☀️";
  } else {
    themeIcon.textContent = "🌙";
    themeLabel.textContent = "🌙";
  }
  localStorage.setItem(THEME_KEY, mode);
}

// Detect initial theme on page load
function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return stored;
  // Fallback: check OS preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Init theme on load
window.addEventListener("DOMContentLoaded", () => {
  setTheme(getPreferredTheme());
  themeToggleBtn.addEventListener("click", () => {
    setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark");
  });
  document.getElementById("user-info-list").classList.add("hide");

});
