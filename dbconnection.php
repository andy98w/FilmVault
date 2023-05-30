<?php

$sname = "localhost";

$unmae = "root";

$password = "Poilkjmn123!";

$db_name = "MyFavMovies";

$conn = mysqli_connect($sname, $unmae, $password, $db_name);

if (!$conn) {

    echo "Connection failed!";

}