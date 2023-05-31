<html>
<link rel="stylesheet" href="stylesheet.css">
<?php
$str = "https://api.themoviedb.org/3/movie/popular?api_key=8d577764c95d04282fe610ceecd260c2&language=en-US&page=1";
$r = file_get_contents($str);
$r = json_decode($r, true);
$r = $r['results']; ?>

<body>
    <div class="horizontal_slider">
        <?php include 'functions.php';
        foreach ($r as $movie) {
            if (isset($movie['poster_path']))
                $img = $movie['poster_path'];
            if (isset($movie['original_title']))
                $title = $movie['original_title'];
            else if (isset($movie['original_name']))
                $title = $movie['original_name'];
            if (isset($movie['overview']))
                $overview = $movie['overview'];
            makecard($img, $title, $overview, "index");
        } ?>
    </div>
</body>
<?php
?>

</html>