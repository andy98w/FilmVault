<html>

<head>
  <link rel="stylesheet" href="stylesheet.css">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
</head>

<body>
  <?php
  include "dbconnection.php";
  $sql = "SELECT id, Usernames FROM users";
  $result = $conn->query($sql);
  while ($row = $result->fetch_assoc()) {
    $user_id = $row['id'];
    $sql = "SELECT * from userratings WHERE user_id='$user_id' ORDER BY rating DESC";
    $temp1 = $conn->query($sql);
    if (mysqli_num_rows($temp1) != 0) {
      details($temp1, $row);
      ?> <br>
    <?php } ?>
    <br>
    <?php
  } ?>
  </div>
  <?php $conn->close();
  ?>
</body>

</html>