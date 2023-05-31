<?php

$sname = "localhost";

$unmae = "qzejskmy_andy";

$password = "Poilkjmn1!";

$db_name = "qzejskmy_MyFavMovies";

$conn = mysqli_connect($sname, $unmae, $password, $db_name);

if (!$conn) {

    echo "Connection failed!";

}