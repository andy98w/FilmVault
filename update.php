<?php
include "dbconnection.php";
session_start();
$rating = $_POST["rating"];
$user_id = $_SESSION['id'];
$movie_id = $_POST['id'];
$sql = "SELECT rating FROM userratings
    WHERE movie_id='$movie_id' AND user_id='$user_id'";
$result = $conn->query($sql);
$result = mysqli_fetch_assoc($result);
$temp = $result['rating'];
$sql = "UPDATE userratings
        SET rating = '$rating'
        WHERE movie_id='$movie_id' AND user_id='$user_id'";
$result = $conn->query($sql);
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
header("location: profile.php?added=Rating Updated!");
exit();
?>