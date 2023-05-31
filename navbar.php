<html>

<head>
  <link rel="stylesheet" href="stylesheet.css">
  </link>
  <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
  <script src="https://kit.fontawesome.com/49b3b5f7cc.js" crossorigin="anonymous"></script>
</head>

<body>
  <div id="topnav">
    <?php include "dbconnection.php"; ?>
    <div class="left">
      <a class="main" href="index.php">MYFAVMOVIES</a>
    </div>
    <?php if (isset($_COOKIE['Username'])) {
      $username = $_COOKIE['Username'];
      $sql = "SELECT profile_pic, Usernames FROM users WHERE Usernames='$username'";
      $result = $conn->query($sql);
      $red = mysqli_fetch_assoc($result);
      $pfp = $red['profile_pic'] ?>
      <div class="right">
        <img class="pfp" src="<?php echo $pfp ?> ">
        <div class="dropdown">
          <button class="dropbtn">
            <?php echo $_COOKIE['Username'] ?>
          </button>
          <div class="dropdown-content">
            <a href="profile.php"> Profile </a>
            <a href="logout.php"> Logout </a>
          </div>
        </div>
      </div>

    <?php } else { ?>
      <div class="right">
        <div class="login">
          <a class="login" href="loginindex.php"> Login </a>
        </div>
      </div>
    <?php } ?>
  </div>
</body>