<?php
// save_user_info.php
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name'], $data['email'], $data['location'])) {
  echo json_encode(['success' => false, 'error' => 'Missing data']);
  exit;
}

$name = $data['name'];
$email = $data['email'];
$lat = $data['location']['lat'];
$lng = $data['location']['lng'];

// Connect to DB (use your own connection code)
$conn = new mysqli('localhost', 'username', 'password', 'database');
if ($conn->connect_error) {
  echo json_encode(['success' => false, 'error' => 'DB connection failed']);
  exit;
}

$stmt = $conn->prepare("INSERT INTO users (name, email, latitude, longitude) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssdd", $name, $email, $lat, $lng);

if ($stmt->execute()) {
  echo json_encode(['success' => true]);
} else {
  echo json_encode(['success' => false, 'error' => 'Insert failed']);
}

$stmt->close();
$conn->close();
?>
