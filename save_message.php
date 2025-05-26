<?php
// save_message.php
// Accept POST: session_id, sender, message (text)

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $session_id = $data['session_id'] ?? '';
    $sender = $data['sender'] ?? 'user';
    $message = $data['message'] ?? '';

    if ($session_id && $message) {
        $conn = new mysqli('localhost', 'dbuser', 'dbpassword', 'dbname');
        if ($conn->connect_error) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'DB connection failed']);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO chat_messages (session_id, sender, message, message_type) VALUES (?, ?, ?, 'text')");
        $stmt->bind_param('sss', $session_id, $sender, $message);
        $stmt->execute();
        $stmt->close();
        $conn->close();

        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
