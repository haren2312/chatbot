<?php
include 'db.php';

if ($_FILES['image']['error'] === 0) {
    $targetDir = "uploads/";
    $fileName = basename($_FILES["image"]["name"]);
    $targetFile = $targetDir . time() . "_" . $fileName;

    $fileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];

    if (in_array($fileType, $allowedTypes)) {
        if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
            $stmt = $conn->prepare("INSERT INTO messages (sender, message, type, image_path, timestamp) VALUES (?, ?, ?, ?, NOW())");
            $sender = "user";  // Or dynamic via session
            $message = "";
            $type = "image";
            $stmt->bind_param("ssss", $sender, $message, $type, $targetFile);
            $stmt->execute();
            echo json_encode(["success" => true, "image" => $targetFile]);
        } else {
            echo json_encode(["success" => false, "error" => "Upload failed"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Invalid file type"]);
    }
}
?>
