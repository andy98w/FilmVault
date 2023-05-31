<?php
include "dbconnection.php";
setcookie("Username", null, time() - 3600, '/');
setcookie("id", null, time() - 3600, '/');

header("Location: index.php");