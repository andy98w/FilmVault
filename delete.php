<?php
include "dbconnection.php";
session_start();
  $id = $_POST['id'];
  $user_id = $_SESSION['id'];
  $sql = "delete from userratings where movie_id=$id AND user_id=$user_id";
  $conn->query($sql);
  $sql = "UPDATE users SET number_of_ratings = number_of_ratings -1 where id=$user_id";
  $conn->query($sql);
  $conn->close();
  header("location: profile.php");
?>