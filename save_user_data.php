<?php
$data = json_decode(file_get_contents("php://input"), true);

$sessionId = $data["sessionId"];
$name = $data["name"];
$email = $data["email"];
$latitude = $data["latitude"];
$longitude = $data["longitude"];

// Connect to MySQL
$conn = new mysqli('localhost', 'username', 'password', 'database');

if ($conn->connect_error) {
  http_response_code(500);
  echo "Database error: " . $conn->connect_error;
  exit;
}

// Insert user info
$stmt = $conn->prepare("INSERT INTO users (session_id, name, email, latitude, longitude) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $sessionId, $name, $email, $latitude, $longitude);
$stmt->execute();
$stmt->close();
$conn->close();

echo "User saved.";
?>
