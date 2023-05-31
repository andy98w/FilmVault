<!DOCTYPE html>
<html>

<head>
    <link rel="stylesheet" href="stylesheet.css">
    </link>
    <title>LOGIN</title>
    <link rel="stylesheet" type="text/css" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
</head>

<div id="Create">
    <div class="logincontainer1">
        <a class="mainlogin1" href="index.php">MYFAVMOVIES</a>
        <div class="formcontainer1">
            <form action="create.php" method="post">
                <h2>Create an Account</h2>
                <p>Already have an account? <a href="loginindex.php">Sign in</a> </p>
                <?php if (isset($_GET['error'])) { ?>
                    <p class="error">
                        <?php echo $_GET['error']; ?>
                    </p>
                <?php } ?>
                <label>Email</label>
                <input type="text" name="email" placeholder="Email"><br>
                <label>User Name</label>
                <input type="text" name="uname" placeholder="User Name"><br>
                <label>Password</label>
                <input type="password" name="password" placeholder="Password"><br>
                <label>Confirm Password</label>
                <input type="confpassword" name="password" placeholder="Confirm Password"><br>
                <button type="submit">Create Account</button>
            </form>
        </div>
    </div>
</div>

</html>