<?php
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

if (!isset($_FILES['image'])) {
    echo json_encode(["success" => false, "error" => "No file uploaded"]);
    exit;
}
$file = $_FILES['image'];
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$target = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $target)) {
    $baseUrl = dirname($_SERVER['SCRIPT_NAME']); // returns /code/chatbot if in that folder
echo json_encode([
    "success" => true,
    "url" => $baseUrl . "/uploads/" . $filename

    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Failed to save"
    ]);
}
?>

