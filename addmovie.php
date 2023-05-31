<?php
include 'dbconnection.php';
$title = $_POST["title"];
$img = $_POST["img"];
$overview = $_POST["overview"];
$username = $_COOKIE['Username'];
$user_id = $_COOKIE['id'];
$title = str_replace("'", "''", $title);
$sql = "SELECT * FROM movies WHERE title='$title'";
$result = $conn->query($sql);
if (mysqli_num_rows($result) === 0) {
  $sql = "insert into movies (title, image, overview) values ('$title', '$img', '$overview')";
  $conn->query($sql);
}
$sql = "SELECT * FROM movies WHERE title='$title'";
$result = $conn->query($sql);
$result = mysqli_fetch_assoc($result);
$movie_id = $result['id'];
$sql = "SELECT * FROM userratings WHERE Username='$username' AND movie_id='$movie_id'";
$result = $conn->query($sql);
if (mysqli_num_rows($result) === 0) {
  $sql = "insert into userratings (username, movie_id, user_id) values ('$username','$movie_id','$user_id')";
  $conn->query($sql);
  $sql = "UPDATE users SET number_of_ratings = number_of_ratings+1 WHERE Usernames='$username'";
  $conn->query($sql);
  $conn->close();
  if ($_POST['from'] === 'index') {
    header("location: index.php?added=Added to Watched!");
    exit();
  } else {

    header("location: searchresults.php?added=Added to Watched!");
    exit();
  }

} else {
  $conn->close();
  if ($_POST['from'] === 'index') {
    header("location: index.php?added=You've already added this!");
    exit();
  } else {
    header("location: searchresults.php?added=You've already added this!");
    exit();
  }

}

?>