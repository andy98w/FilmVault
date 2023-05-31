<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="stylesheet.css">
    </link>
    <title>LOGIN</title>

    <link rel="stylesheet" type="text/css" href="stylesheet.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>

</head>
<div id="login">
    <div class="logincontainer">
        <a class="mainlogin" href="index.php">MYFAVMOVIES</a>
        <div class="formcontainer">
            <form action="login.php" method="post">
                <h2>Welcome Back!</h2>
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
                <input type="text" name="email" placeholder="Enter Email"><br>
                <label>Password</label>
                <input type="password" name="password" placeholder="Enter Password"><br>
                <a class="verify" href="resend_verification.php">Forgot to Verify?</a>
                <a class="forgot" href="forgotpassword.php">Forgot Password?</a>
                <button type="submit">Log In</button>
            </form>
            <p> Don't have an account? <a href="createaccount.php">Sign up</a> </p>

        </div>
    </div>
</div>

</html>