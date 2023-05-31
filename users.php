<html>

<head>
    <link rel="stylesheet" href="stylesheet.css">
    <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
    <link rel="stylesheet" href="http://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
    <link href='https://fonts.googleapis.com/css?family=Lato:400,700' rel='stylesheet' type='text/css'>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
</head>

<body>
    <?php include "dbconnection.php";
    $sql = "SELECT id, Usernames, Number_of_ratings, profile_pic, email_verified_at FROM users ORDER BY number_of_ratings DESC"; ?>
    <div class="col-md-12">
        <div class="tablecontainer">
            <table class="mytable">
                <?php $result = $conn->query($sql); ?>
                <tr>
                    <th class="tableheader1">
                        <h7>Username</h7>
                    </th>
                    <th>
                        <h3></h3>
                    </th>
                    <th class="tableheader2">
                        <h7>Number of Ratings</h7>
                    </th>
                </tr>
                <?php while ($row = $result->fetch_assoc()) { 
                    if ($row['email_verified_at']!=NULL) { ?> 
                    <tr>
                        <td class="pic"><a href="" id='<?php echo $row['id'] ?>' title=" "><img class="pfp"
                                    src="<?php echo $row['profile_pic'] ?>" style="width:50px;height:50px" /></a>
                        </td>
                        <td><a href="" id='<?php echo $row['id'] ?>' title=" ">
                                <h6>
                                    <?php echo $row['Usernames']; ?>
                                </h6>
                            </a>
                        <td class="tableheader2">
                            <h7>
                                <?php echo $row['Number_of_ratings']; ?>
                            </h7>
                    </tr>
                <?php }} ?>
            </table>
            <div class="tablecontainer">
            </div>
</body>
</html>