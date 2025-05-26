<?php
$conn = new mysqli("localhost", "root", "", "chatbot");

$customers = $conn->query("SELECT * FROM users WHERE role='customer'");
?>
<!DOCTYPE html>
<html>
<head>
  <title>Admin Chat Panel</title>
  <style>
    body { font-family: Arial; display: flex; gap: 20px; padding: 20px; }
    #chat { flex: 1; border: 1px solid #ccc; padding: 10px; border-radius: 10px; }
    #customers { width: 200px; border: 1px solid #ccc; padding: 10px; }
    #messages { height: 300px; overflow-y: scroll; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; }
    .message { padding: 5px; border-radius: 8px; margin-bottom: 4px; }
    .admin { background: #d0f0fd; text-align: right; }
    .customer { background: #f0f0f0; text-align: left; }
  </style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.4/dist/index.min.js"></script>

<div id="customers">
  <h3>Customers</h3>
  <ul>
    <?php while($c = $customers->fetch_assoc()) {
      echo "<li><a href='?customer_id={$c['id']}'>{$c['name']}</a></li>";
    } ?>
  </ul>
</div>

<div id="chat">
  <h3>Chat with Customer</h3>
  <?php if (isset($_GET['customer_id'])): 
    $customerId = $_GET['customer_id'];
    ?>
    <div id="messages"></div>
    <form onsubmit="sendMessage(); return false;">
      <input type="text" id="adminMsg" placeholder="Type a message..." style="width: 80%;" />
      <button type="submit">Send</button>
    </form>
    <script>
      const adminId = 1;
      const customerId = <?php echo $customerId; ?>;

      function loadMessages() {
        fetch(`get_messages.php?sender=${adminId}&receiver=${customerId}`)
          .then(res => res.json())
          .then(data => {
            const msgDiv = document.getElementById('messages');
            msgDiv.innerHTML = '';
            data.forEach(msg => {
              const div = document.createElement('div');
              div.classList.add('message');
              div.classList.add(msg.sender_id == adminId ? 'admin' : 'customer');
              div.textContent = msg.message;
              msgDiv.appendChild(div);
            });
            msgDiv.scrollTop = msgDiv.scrollHeight;
          });
      }

      function sendMessage() {
        const msg = document.getElementById('adminMsg').value;
        fetch('send_message.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: `sender=${adminId}&receiver=${customerId}&message=${encodeURIComponent(msg)}`
        }).then(() => {
          document.getElementById('adminMsg').value = '';
          loadMessages();
        });
      }

      loadMessages();
      setInterval(loadMessages, 3000);

      if (strpos($row['message'], 'uploads/') !== false) {
  echo "<div class='message {$cls}'><img src='{$row['message']}' style='max-width:150px;' /></div>";
} else {
  echo "<div class='message {$cls}'>{$row['message']}</div>";
}
    </script>
  <?php else: ?>
    <p>Select a customer to start chat.</p>
  <?php endif; ?>
</div>

</body>
</html>s