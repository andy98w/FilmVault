<!DOCTYPE html>
<?php include 'navbar.php'; ?>
<html>

<head>
    <link rel="stylesheet" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
    <script src="https://kit.fontawesome.com/49b3b5f7cc.js" crossorigin="anonymous"></script>
</head>

<body>
    <div id="searchresults">
        <?php if (isset($_GET['added'])) { ?>
            <p class="warning">
                <?php echo $_GET['added']; ?>
            </p>
        <?php } ?>
        <div class="container">
            <div class="formcontainer4">
                <?php
                if (isset($_POST["search"])) {
                    $temp = "Showing results for '" . $_POST["search"] . "' ";
                } else if (isset($_GET['added'])) {
                    $temp = $_GET['added'];
                } ?>
                <h1>
                    <?php echo $temp; ?>
                </h1>
                <form action="searchresults.php" method="POST">
                    <input type="text" placeholder="&#xf002; Search another movie" class="form-control m-2" id="name"
                        name="search">
                    <button type="submit" class="btn-search">Search</button>
                </form>
            </div>
        </div>
        <?php
        if (isset($_POST["search"])) {
            $results = array();
            for ($i = 0; $i < 6; $i++) {
                $str = "https://api.themoviedb.org/3/search/multi?api_key=8d577764c95d04282fe610ceecd260c2&language=en-US&query=" . $_POST["search"] . "&page=" . $i + 1 . "&include_adult=false";
                $r = file_get_contents($str);
                $r = json_decode($r, true);
                $r = $r['results'];
                $results = array_merge($results, $r);
            }
            $number_of_results = count($results);
            $results_per_page = 20;
            $number_of_pages = ceil($number_of_results / $results_per_page) - 1;
            if (!isset($_POST['page'])) {
                $page = 1;
            } else {
                $page = $_POST['page'];
            }
            include 'functions.php'; ?>
            <div class="searchresults">
                <div class="container">
                    <?php for ($i = 0; $i < $results_per_page; $i++) {
                        if (isset($results[(($page - 1) * $results_per_page) + $i]['poster_path']))
                            $img = $results[(($page - 1) * $results_per_page) + $i]['poster_path'];
                        if (isset($results[(($page - 1) * $results_per_page) + $i]['original_title']))
                            $title = $results[(($page - 1) * $results_per_page) + $i]['original_title'];
                        else if (isset($results[(($page - 1) * $results_per_page) + $i]['original_name']))
                            $title = $results[(($page - 1) * $results_per_page) + $i]['original_name'];
                        if (isset($results[(($page - 1) * $results_per_page) + $i]['overview']) && !empty($results[(($page - 1) * $results_per_page) + $i]))
                            $overview = $results[(($page - 1) * $results_per_page) + $i]['overview'];
                        else
                            $overview = "No Description Available";
                        if (isset($img) && isset($title))
                            makecard($img, $title, $overview, "search");
                        else
                            $results_per_page++;
                    } ?>
                </div>
                <div class="nextpage">
                    <?php
                    for ($page = 1; $page <= $number_of_pages; $page++) {
                        ?>
                        <div class="nextpagebutton">
                            <form action="" method="POST">
                                <input type="hidden" name="search" value='<?php echo $_POST["search"] ?>' />
                                <input type="hidden" name="page" value="<?php echo $page ?>" />
                                <button type="submit" class="nextpagebuttonform">
                                    <?php echo $page ?>
                                </button>
                            </form>
                        </div>
                    <?php } ?>
                </div>
            <?php } ?>
        </div>
    </div>
</body>

</html>