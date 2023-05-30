<body>
    <div class="horizontal_slider">
        <?php include_once 'functions.php';
        include "dbconnection.php";
        $sql = "SELECT rating, movie_id FROM userratings ORDER BY rating DESC";
        $order = $conn->query($sql);
        while ($row = $order->fetch_assoc()) {
            $column = $row['movie_id'];
            $sql = "SELECT * FROM movies WHERE id='$column'";
            $red = $conn->query($sql);
            $red = mysqli_fetch_assoc($red);
            $title = $red['title'];
            $poster = $red['image'];
            $overview = $red['overview'];
            makecard($poster, $title, $overview, $column);
        } ?>
    </div>
</body>