<?php
include('dbconnection.php');
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'vendor/autoload.php';
include 'dbconnection.php';

if (isset($_POST["email"]) && (!empty($_POST["email"]))) {
   $email = $_POST["email"];
   if (!$email) {
      header("Location: forgotpassword.php?error=Invalid email address please type a valid email address!");
      exit();
   } else {
      $sel_query = "SELECT * FROM `users` WHERE Emails='" . $email . "'";
      $results = $conn->query($sel_query);
      if (mysqli_num_rows($results) == 0) {
         header("Location: forgotpassword.php?error=No user associated with this email!");
         exit();
      }
   }

   $expFormat = mktime(
      date("H"),
      date("i"),
      date("s"),
      date("m"), date("d") + 1,
      date("Y")
   );
   $expDate = date("Y-m-d H:i:s", $expFormat);
   $key = $email;
   $addKey = substr(md5(uniqid(rand(), 1)), 3, 10);
   $key = $key . $addKey;
   // Insert Temp Table
   $sql = "INSERT INTO `password_reset_temp` (`email`, `key`, `expDate`)
VALUES ('" . $email . "', '" . $key . "', '" . $expDate . "');";
   $conn->query($sql);


   $output = '<p>Dear user,</p>';
   $output .= '<p>Please click on the following link to reset your password.</p>';
   $output .= '<p>-------------------------------------------------------------</p>';
   $output .= '<p><a href="https://myfavmovie.co/MyFavMovies/reset-password.php?key=' . $key . '&email=' . $email . '&action=reset" target="_blank">
reset-password
?key=' . $key . '&email=' . $email . '&action=reset</a></p>';
   $output .= '<p>-------------------------------------------------------------</p>';
   $output .= '<p>Please be sure to copy the entire link into your browser.
The link will expire after 1 day for security reason.</p>';
   $output .= '<p>If you did not request this forgotten password email, no action 
is needed, your password will not be reset. However, you may want to log into 
your account and change your security password as someone may have guessed it.</p>';
   $body = $output;
   $subject = "Password Recovery - MyFavMovies";

   $email_to = $email;
   $mail = new PHPMailer();
   $mail->IsSMTP();
   $mail->Host = "smtp.gmail.com";
   $mail->SMTPAuth = true;
   $mail->Username = "awseer09@gmail.com";
   $mail->Password = "kpnrrgscbpqpzazr";
   $mail->Port = 587;
   $mail->IsHTML(true);
   $mail->setFrom('awseer09@gmail.com', 'adSnan-tech.com');
   $mail->Subject = $subject;
   $mail->Body = $body;
   $mail->AddAddress($email_to);
   if (!$mail->Send()) {
      header("Location: forgotpassword.php?error=Mailer Error: You must provide at least one recipient email address.");
      exit();
   } else {
      header("Location: loginindex.php?error=An Email has been sent to you with instructions on how to recover your password");
      exit();
   }
}