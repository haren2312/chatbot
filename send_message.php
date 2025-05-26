<?php
$conn = new mysqli("localhost", "root", "", "chatbot");

$sender = $_POST['sender'];
$receiver = $_POST['receiver'];
$message = $_POST['message'];

if (!empty($message)) {
    $stmt = $conn->prepare("INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $sender, $receiver, $message);
    $stmt->execute();
}
echo "Message sent";
?>