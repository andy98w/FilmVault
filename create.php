<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once 'C:\Windows\System32\vendor\autoload.php';

include 'dbconnection.php';
$email = $_POST["email"];
$uname = $_POST["uname"];
$pass = $_POST["password"];
$sql = "SELECT * FROM users WHERE Usernames='$uname' OR Emails='$email'";
$result = $conn->query($sql);
if (strlen($pass) < 5 || strlen($pass) > 32) {
  header("Location: createaccount.php?error=Password must be between 5-32 characters long!");
  exit();
}
if (strlen($uname) < 5 || strlen($uname) > 32) {
  header("Location: createaccount.php?error=Username must be between 5-32 characters long!");
  exit();
}
if (mysqli_num_rows($result) > 0) {
  header("Location: createaccount.php?error=Username or Email already exists!");
  exit();
} else {
  $mail = new PHPMailer(true);
  try {
    $mail->SMTPDebug = 0;
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'awseer09@gmail.com';
    $mail->Password = 'kpnrrgscbpqpzazr';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->setFrom('awseer09@gmail.com', 'adnan-tech.com');
    $mail->addAddress($email, $uname);
    $mail->isHTML(true);
    $verification_code = substr(number_format(time() * rand(), 0, '', ''), 0, 6);
    $mail->Subject = 'Email verification';
    $mail->Body = '<p>Your verification code is: <b style="font-size: 30px;">' . $verification_code . '</b><p>';
    $mail->send();
    $pass = md5($pass);
    $sql = "INSERT INTO users (emails, Usernames, Passwords, verification_code, email_verified_at) VALUES ('$email', '$uname', '$pass','$verification_code',NULL)";
    $conn->query($sql);
    $conn->close();
    header("location: email-verification.php?email=" . $email);
    exit();
  } catch (Exception $e) {
    $conn->close();
    header("location: createaccount.php?error=Mailer Error: {$mail->ErrorInfo}");
    exit();
  }

}
?>