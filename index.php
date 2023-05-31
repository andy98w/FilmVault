<!DOCTYPE html>
<?php include 'navbar.php'; ?>
<html>

<head>
    <link rel="stylesheet" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
    <script src="https://kit.fontawesome.com/49b3b5f7cc.js" crossorigin="anonymous"></script>
</head>
<div id="index">

    <body>
        <div id="search">
            <div class="container">
                <div class="search">
                    <?php if (isset($_GET['added'])) { ?>
                        <div class="warning">
                            <p>
                                <?php echo $_GET['added']; ?>
                            </p>
                        </div>

                    <?php } ?>
                    <div class="formcontainer3">
                        <form action="searchresults.php" method="POST">
                            <input type="text" placeholder="&#xf002; Search Movie" id="name" name="search">
                            <button type="submit" class="btn-search">Search</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div id="topMovies">
            <div class="container">
                <div class="row">
                    <h2> Top movies of today </h2>
                    <?php include 'topmovies.php'; ?>
                </div>
            </div>
        </div>
        <div id="topRated">
            <div class="container">
                <div class="row">
                    <h2> Top rated on MyFavMovies </h2>
                    <?php include 'topusermovies.php'; ?>
                </div>
            </div>
        </div>
        <div id="mostContributed">
            <div class="container">
                <div class="row">
                    <h2> Most Contributed Users</h2>
                    <?php include 'users.php'; ?>
                </div>
            </div>
        </div>
    </body>
</div>
<!-- <?php include 'footer.php'; ?> -->

</html>