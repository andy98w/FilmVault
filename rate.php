<?php
session_start();
include 'dbconnection.php';
$rating = $_POST["rating"];
$user_id = $_SESSION['id'];
$movie_id = $_POST['id'];
if ($rating < 0 || $rating > 100) {
  header("location: profile.php?rated=Invalid rating (must be /100)");
  exit();
}
$sql = "UPDATE userratings
  SET rating = '$rating'
  WHERE movie_id='$movie_id'";
$conn->query($sql);
$sql = "SELECT AVG(rating)
            FROM userratings WHERE movie_id='$movie_id'";
$result = $conn->query($sql);
$result = mysqli_fetch_assoc($result);
$result = $result['AVG(rating)'];
$sql = "UPDATE movies
        SET avgrating = '$result'
        WHERE id='$movie_id'";
$conn->query($sql);
$conn->close();
header("location: profile.php?rated=Rating Added!");
exit();

?>