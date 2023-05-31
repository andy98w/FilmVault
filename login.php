<?php
include "dbconnection.php";

if (isset($_POST['email']) && isset($_POST['password'])) {
    $email = $_POST["email"];
    $pass = $_POST["password"];
    $pass = md5($pass);
    if (empty($email)) {
        header("Location: loginindex.php?error=Email is required");
        exit();
    } else if (empty($pass)) {
        header("Location: loginindex.php?error=Password is required");
        exit();
    } else {
        $sql = "SELECT * FROM users WHERE Emails='$email' AND Passwords='$pass'";
        $result = $conn->query($sql);
        if (mysqli_num_rows($result) >= 1) {
            $row = mysqli_fetch_assoc($result);
            if ($row['email_verified_at'] == null) {
                header("Location: loginindex.php?error=Please verify your email!");
                exit();
            }
            if ($row['Emails'] === $email && $row['Passwords'] === $pass) {
                setcookie("Username", $row['Usernames'], time() + (86400 * 30), "/");
                setcookie("id", $row['id'], time() + (86400 * 30), "/");
                header("Location: index.php?error=Logged in!");
                exit();
            } else {
                header("Location: loginindex.php?error=Incorect Email or password");
                exit();
            }
        } else {
            header("Location: loginindex.php?error=Incorect Email or password");
            exit();
        }
    }
} else {
    header("Location: loginindex.php");
    exit();
}
?>