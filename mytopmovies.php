<?php
include "dbconnection.php";
$username = $_COOKIE['Username'];
if (isset($_POST['DESC'])) {
    $sql = "SELECT * FROM userratings WHERE Username = '$username' ORDER BY rating ASC";
    $order = $conn->query($sql);
} else {
    $sql = "SELECT * FROM userratings  WHERE Username = '$username' ORDER BY rating DESC";
    $order = $conn->query($sql);
}
if (mysqli_num_rows($order) === 0) { ?>
    <h1> You have not added any movies! </h1>
<?php } else {
    ?>
    <h2>Here are your watched movies</h2>
    <?php
    while ($row = $order->fetch_assoc()) {
        $column = $row['movie_id'];
        $sql = "SELECT * FROM movies WHERE id='$column'";
        $red = $conn->query($sql);
        $red = mysqli_fetch_assoc($red);
        $title = $red['title'];
        $poster = $red['image'];
        makecard2($poster, $title, $column); ?>
    <?php } ?>
<?php }
$conn->close();