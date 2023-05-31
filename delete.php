<?php
include "dbconnection.php";
$id = $_POST['id'];
$username = $_COOKIE['Username'];
$sql = "delete from userratings where movie_id='$id' AND Username='$username'";
$conn->query($sql);
$sql = "UPDATE users SET number_of_ratings = number_of_ratings -1 where Usernames='$username'";
$conn->query($sql);
$conn->close();
header("location: profile.php");
exit();
?>