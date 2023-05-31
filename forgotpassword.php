<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="stylesheet.css">
    </link>
    <title>Forgot</title>
    <link rel="stylesheet" type="text/css" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>

</head>
<div id="login">
    <div class="logincontainer">
        <a class="mainlogin" href="index.php">MYFAVMOVIES</a>
        <div class="formcontainer">
            <form action="forgot.php" method="post">
                <h2>Forgot Password</h2>
                <?php if (isset($_GET['error'])) { ?>
                    <p class="error">
                        <?php echo $_GET['error']; ?>
                    </p>
                <?php } ?>
                <?php if (isset($_GET['create'])) { ?>
                    <p class="create">
                        <?php echo $_GET['create']; ?>
                    </p>
                <?php } ?>
                <label>Email</label>
                <input type="text" name="email" placeholder="Email"><br>

                <button type="submit">Send Email</button>
            </form>
            <a class="backbtn" href="loginindex.php">
                <p>Back to login</p>
            </a>
        </div>
    </div>
</div>

</html>