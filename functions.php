<html>

<head>
    <link rel="stylesheet" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
    <script src="https://kit.fontawesome.com/49b3b5f7cc.js" crossorigin="anonymous"></script>
</head>
<?php

function makecard3($poster_path, $original_title, $user_id, $column)
{ ?>

    <div class="item">
        <?php
        include "dbconnection.php";
        if (strlen($original_title) > 27)
            $original_title = substr($original_title, 0, 27) . "...";
        echo "<img src=\"$poster_path\" >"; ?>
        <?php
        echo "<br>";
        $sql = "SELECT rating FROM userratings WHERE user_id='$user_id' AND movie_id='$column'";
        $temp = $conn->query($sql);
        if (mysqli_num_rows($temp) === 0) {
            echo "Has not rated this movie yet";
        } else {
            $temp = mysqli_fetch_assoc($temp);
            $temp = $temp['rating'];
            echo "rating: " . $temp;
        } ?>
        <h3>
            <?php echo $original_title; ?>
    </div>
    <?php
} ?>
</form>

<?php

function makecard2($poster_path, $original_title, $column)
{
    include "dbconnection.php";
    $user_id = $_SESSION['id']; ?>
    <div class="item">
        <?php
        if (strlen($original_title) > 27)
            $original_title = substr($original_title, 0, 27) . "...";
        echo "<img src=\"$poster_path\" >"; ?>
        <div class="layer">
            <form class="form1" action="delete.php" method="POST">
                <input type="hidden" name="id" value="<?php echo $column ?>" />
                <button type="submit" class="layerformbutton">Remove from list</button>
            </form>
            <?php
            $sql = "SELECT rating from userratings WHERE user_id='$user_id' AND movie_id='$column'";
            $rated = $conn->query($sql);
            $rated = mysqli_fetch_assoc($rated);
            $rated = $rated['rating'];
            if ($rated === NULL) { ?>
                <h3> You haven't rated this yet! </h3>
                <form class="form2" action="rate.php" method="POST">
                    <input type="number" name="rating" placeholder="Rating">
                    <input type="hidden" name="id" value="<?php echo $column ?>" />
                    <button type="submit" class="layerformbutton2">Rate this movie</button>
                </form>
            <?php } else { ?>
                <h3> You rated this a
                    <?php echo $rated ?> /100
                </h3>
                <form action="update.php" method="POST">
                    <input type="number" name="rating" placeholder="Rating"><br>
                    <input type="hidden" name="id" value="<?php echo $column ?>" />
                    <button type="submit" class="layerformbutton2">Update your rating</button>
                </form>
            <?php } ?>
        </div>
        <h3>
            <?php echo $original_title; ?>
    </div>
    </h3>
    <?php
} ?>
<?php function makecard($poster_path, $original_title, $overview, $original_destination)
{ ?>
    <div class="item">
        <?php
        if (strlen($original_title) > 27)
            $original_title = substr($original_title, 0, 27) . "...";
        if (strlen($overview) > 570)
            $overview = substr($overview, 0, 570) . "...";
        $poster = "http://image.tmdb.org/t/p/w500/" . $poster_path; ?>
        <img src=<?php echo "$poster" ?>>
        <div class="layer">
            <p><span>
                    <?php
                    echo $overview; ?>
                </span>
                <?php
                if (isset($_SESSION['id']) && isset($_SESSION['Usernames'])) { ?>
                <form class="form1" action="addmovie.php" method="POST">
                    <input type="hidden" name="from" value='<?php echo $original_destination ?>' />
                    <input type="hidden" name="title" value="<?php echo $original_title ?>" />
                    <input type="hidden" name="img" value="<?php echo $poster ?>" />
                    <input type="hidden" name="overview" value="<?php echo $overview ?>" />
                    <button type="submit" class="layerformbutton">Add to List</button>
                </form>
            <?php } ?>
            </p>
        </div>
        <h3>
            <?php echo $original_title; ?>
        </h3>
    </div>
<?php } ?>

</html>
<?php
function details($temp1, $row)
{
    include "dbconnection.php";
    $user_id = $row['id']; ?>
    <?php echo $row['Usernames'] . "'s Movies"; ?>
    <div class="horizontal_slider">
        <?php makeslider($temp1, $user_id);
        ?>
    </div>
    <?php
}
function makeslider($temp1, $user_id)
{
    include "dbconnection.php";
    while ($row1 = $temp1->fetch_assoc()) {
        $column = $row1['movie_id'];
        $sql = "SELECT * FROM movies WHERE id='$column'";
        $red = $conn->query($sql);
        $red = mysqli_fetch_assoc($red);
        $title = $red['title'];
        $poster = $red['image'];
        makecard3($poster, $title, $user_id, $column);
    }
}