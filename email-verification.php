<!DOCTYPE html>
<html>

<head>
<link rel="stylesheet" href="stylesheet.css"></link>
    <title>LOGIN</title>
    <link rel="stylesheet" type="text/css" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
</head>
<?php
if (isset($_POST["verify_email"])) {
    $email = $_GET["email"];
    $verification_code = $_POST["verification_code"];
    include 'dbconnection.php';
    $sql = "SELECT verification_code FROM users WHERE emails = '$email'";
    $result = $conn->query($sql);
    $result = mysqli_fetch_assoc($result);
    if($result['verification_code'] != $verification_code){
        $conn->close();
        header("location: email-verification.php?error=Verification Code Failed");
         exit();
    }
    else{
        $sql = "UPDATE users SET email_verified_at = NOW() WHERE emails = '$email'";
        $result = $conn->query($sql);
        $conn->close();
        header("location: loginindex.php?create=Account Created!");
        exit();
    }

} ?>
<div id = "Email">
    <div class="logincontainer">
        <a class = "mainlogin" href="index.php">MYFAVMOVIES</a>
        <div class = "formcontainer">
        <form method="POST">
            <input type="hidden" name="email" value="<?php echo $email ?>" required>
            <p> DO NOT EXIT THIS PAGE UNTIL YOU VERIFY </p>
            <input type="text" name="verification_code" placeholder="Enter verification code sent to your email" required />
            <input class="btn1" type = "submit" name = "verify_email" value="Verify Email">
        </form>
        </div>
    </div>
</div>
