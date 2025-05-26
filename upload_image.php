<?php
// upload_image.php
// Handle image upload and save to server

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $session_id = $_POST['session_id'] ?? 'unknown';
    
    $uploadDir = 'uploads/chat_images/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $file = $_FILES['image'];
    $filename = time() . '_' . basename($file['name']);
    $targetFile = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        // Save message to DB (MySQL)
        $conn = new mysqli('localhost', 'dbuser', 'dbpassword', 'dbname');
        if ($conn->connect_error) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'DB connection failed']);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO chat_messages (session_id, sender, message, message_type) VALUES (?, 'user', ?, 'image')");
        $url = $targetFile;  // Save relative path or full URL if you want
        $stmt->bind_param('ss', $session_id, $url);
        $stmt->execute();
        $stmt->close();
        $conn->close();

        echo json_encode(['success' => true, 'url' => $url]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No image sent']);
}
?>
