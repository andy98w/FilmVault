<?php
include('dbconnection.php');
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'vendor/autoload.php';
include 'dbconnection.php';
$mail = new PHPMailer(true);
$email = $_POST["email"];
$sql = "SELECT * FROM users WHERE Emails='$email'";
$result = $conn->query($sql);
if (isset($_POST["email"]) && (!empty($_POST["email"]))) {
    $email = $_POST["email"];
    if (!$email) {
        header("Location: resend_verification.php?error=Invalid email address please type a valid email address!");
        exit();
    }
} if (mysqli_num_rows($result) === 0) {
    header("Location: resend_verification.php?error=No account associated with this email!");
    exit();
} 
$red = mysqli_fetch_assoc($result);
if ($red['email_verified_at'] != NULL) {
    header("Location: resend_verification.php?error=You already verified this account!");
    exit();
} else {
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
    $sql = "UPDATE users SET verification_code='$verification_code' WHERE Emails='$email'";
    $conn->query($sql);
    $conn->close(); 
    header("location: email-verification.php?email=" . $email);
    exit();
    } catch (Exception $e) {
    $conn->close();
    header("location: resend_verification?error=Mailer Error: {$mail->ErrorInfo}");
    exit();
    }
}