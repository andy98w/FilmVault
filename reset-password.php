<head>
  <link rel="stylesheet" href="stylesheet.css">
  </link>
  <title>LOGIN</title>

  <link rel="stylesheet" type="text/css" href="stylesheet.css">
  <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>

</head>
<?php
include('dbconnection.php');
$error = "";
if (
  isset($_GET["key"]) && isset($_GET["email"]) && isset($_GET["action"])
  && ($_GET["action"] == "reset") && !isset($_POST["action"])
) {
  $key = $_GET["key"];
  $email = $_GET["email"];
  $curDate = date("Y-m-d H:i:s");
  $sql = "SELECT * FROM `password_reset_temp` WHERE `key`='" . $key . "' and `email`='" . $email . "';";
  $query = $conn->query($sql);

  $row = mysqli_num_rows($query);
  if ($row == "") {
    $error .= '<h2>Invalid Link</h2>
<p>The link is invalid/expired. Either you did not copy the correct link
from the email, or you have already used the key in which case it is 
deactivated.</p>
<p><a href="forgotpassword.php">
Click here</a> to reset password.</p>';
  } else {
    $row = mysqli_fetch_assoc($query);
    $expDate = $row['expDate'];
    if ($expDate >= $curDate) {
      ?>
      <div id="login">
        <div class="logincontainer">
          <a class="mainlogin" href="index.php">MYFAVMOVIES</a>
          <div class="formcontainer">
            <br />
            <form method="post" action="" name="update">
              <input type="hidden" name="action" value="update" />
              <br /><br />
              <label><strong>Enter New Password:</strong></label><br />
              <input type="password" name="pass1" maxlength="15" required />
              <br /><br />
              <label><strong>Re-Enter New Password:</strong></label><br />
              <input type="password" name="pass2" maxlength="15" required />
              <br /><br />
              <input type="hidden" name="email" value="<?php echo $email; ?>" />
              <input type="submit" value="Reset Password" />
            </form>
          </div>
          <?php
    } else {
      $error .= "<h2>Link Expired</h2>
<p>The link is expired. You are trying to use the expired link which 
as valid only 24 hours (1 days after request).<br /><br /></p>";
    }
  }
  if ($error != "") {
    echo "<div class='error'>" . $error . "</div><br />";
  }
}


if (
  isset($_POST["email"]) && isset($_POST["action"]) &&
  ($_POST["action"] == "update")
) {
  $error = "";
  $pass1 = $_POST["pass1"];
  $pass2 = $_POST["pass2"];
  $email = $_POST["email"];
  $curDate = date("Y-m-d H:i:s");
  if ($pass1 != $pass2) {
    $error .= "<p>Password do not match, both password should be same.<br /><br /></p>";
  }
  if ($error != "") {
    echo "<div class='error'>" . $error . "</div><br />";
  } else {
    $pass1 = md5($pass1);
    $sql = "UPDATE users SET Passwords='$pass1' WHERE Emails='$email'";
    $conn->query($sql);
    $sql = "DELETE FROM password_reset_temp WHERE email='$email'";
    $conn->query($sql);

    header("Location: loginindex.php?error=Your password has been reset!");
    exit();
  }
}
?>