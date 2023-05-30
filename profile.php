<!DOCTYPE html>
<?php include 'navbar.php'; ?>
<html>

<head>
    <link rel="stylesheet" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
    <script src="https://kit.fontawesome.com/49b3b5f7cc.js" crossorigin="anonymous"></script>
</head>

<body>
    <?php include "dbconnection.php";
    $user_id = $_SESSION['id'];
    $sql = "SELECT profile_pic FROM users WHERE id='$user_id'";
    $result = $conn->query($sql);
    $red = mysqli_fetch_assoc($result);
    $pfp = $red['profile_pic'] ?>
    <div id="profile">
        <div class="container">
            <div class="header1">
                <img class="pfplarge" src="<?php echo $pfp ?> ">
                <h5> Welcome back, </h5>
                <h4>
                    <?php echo $_SESSION['Usernames'] ?>
                </h4>
            </div>
            <?php if (isset($_GET['rated'])) { ?>
                <p class="warning">
                    <?php echo $_GET['rated']; ?>
                </p>
            <?php } ?>
        </div>
    </div>
    <?php
    $temp = "High to Low";
    if (isset($_POST['ASC'])) {
        $sql = "SELECT * FROM userratings WHERE user_id = '$user_id' ORDER BY rating DESC";
        $order = $conn->query($sql);
    } else {
        $sql = "SELECT * FROM userratings  WHERE user_id = '$user_id' ORDER BY rating ASC";
        $order = $conn->query($sql);
        $temp = "Low to High";
    }
    if (mysqli_num_rows($order) === 0) { ?>
        <h1> You have not added any movies! </h1>
    <?php } else {
        ?>
        <div class="dropcontainer">
            <div class="dropdownpfp">
                <p>Sort By: </p>
                <button class="dropbtnpfp">
                    <?php echo $temp ?>
                </button>
                <form action="profile.php" method="POST">
                    <div class="dropdown-contentpfp">
                        <input class="dropdown-contentpfp input" type="submit" name="DESC" value="Low to High"><br>
                        <input class="dropdown-contentpfp input2" type="submit" name="ASC" value="High to Low"><br>
                    </div>
                </form>
            </div>
        </div>
        <div class="container">
            <div class="profilemovies">
                <?php
                include "functions.php";
                while ($row = $order->fetch_assoc()) {
                    $column = $row['movie_id'];
                    $sql = "SELECT * FROM movies WHERE id='$column'";
                    $red = $conn->query($sql);
                    $red = mysqli_fetch_assoc($red);
                    $title = $red['title'];
                    $poster = $red['image'];
                    makecard2($poster, $title, $column); ?>
                <?php } ?>
            </div>
        </div>
    <?php }
    $conn->close();

    ?>
    </div>
</body>

</html>