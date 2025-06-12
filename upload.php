<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    // Folder where uploads go (no session subfolders)
    $uploadDir = __DIR__ . "/uploads/";
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Basic filename sanitization: timestamp + random + original extension
    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $targetFile = $uploadDir . $filename;

    // Move the uploaded file
    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
        // **This is the PUBLIC URL!**
        $webUrl = "/uploads/" . $filename;

        // Double-check it actually exists
        if (file_exists($targetFile)) {
            echo json_encode(["success" => true, "url" => $webUrl]);
        } else {
            echo json_encode(["success" => false, "error" => "File not saved"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Upload failed"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "No file uploaded"]);
}
?>
