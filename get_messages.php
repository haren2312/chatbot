<?php
// get_messages.php
// Returns JSON list of messages for session_id

$session_id = $_GET['session_id'] ?? '';

if (!$session_id) {
    http_response_code(400);
    echo json_encode([]);
    exit;
}

$conn = new mysqli('localhost', 'dbuser', 'dbpassword', 'dbname');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([]);
    exit;
}

$stmt = $conn->prepare("SELECT sender, message, message_type, timestamp FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC");
$stmt->bind_param('s', $session_id);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}

$stmt->close();
$conn->close();

header('Content-Type: application/json');
echo json_encode($messages);
?>
