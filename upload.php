<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $sessionId = $_POST['sessionId'] ?? 'unknown';
    $uploadDir = "uploads/" . $sessionId . "/";

    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $filename = time() . "_" . basename($_FILES['image']['name']);
    $targetFile = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
        $webUrl = '/' . $targetFile;
        echo json_encode(["success" => true, "url" => $webUrl]);

    } else {
        echo json_encode(["success" => false, "error" => "Upload failed"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "No file uploaded"]);
}
?>
