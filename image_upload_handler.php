<?php
// image_upload_handler.php

header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// Check if image file is sent
if (!isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Upload error code: ' . $file['error']]);
    exit;
}

// Define upload path
$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true); // Create folder if it doesn't exist
}

// Generate a unique file name
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('img_', true) . '.' . $ext;
$filepath = $uploadDir . '/' . $filename;

// Move the uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Build the public URL for the file
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $url = $protocol . "://" . $host . dirname($_SERVER['PHP_SELF']) . "/uploads/" . $filename;

    echo json_encode(['success' => true, 'url' => $url]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to save file']);
}
