<?php
include "dbconnection.php";
if(isset($_POST['id'])){
    $user_id=$_POST['id'];
    $sql = "SELECT * FROM userratings WHERE user_id='$user_id' ORDER BY rating DESC LIMIT 3;";
    $result = $conn->query($sql);
    $output = "";
    if(mysqli_num_rows($result)===0) echo "<h3> Has not rated any movies </h3>";
    else{
        $output = ' <h2> Top Movies: </h2> <div class="horizontal_slider">';
        while($row = $result->fetch_assoc()){
            $column = $row['movie_id'];
            $sql = "SELECT * FROM movies WHERE id='$column'"; 
            $results = $conn->query($sql);
            $red = $conn->query($sql);
            $red = mysqli_fetch_assoc($red);
            $title = $red['title'];
            $poster = $red['image']; 
            $poster = "http://image.tmdb.org/t/p/w500/" . $poster;
            $output .= '
            <p><img src="http://image.tmdb.org/t/p/w500/'.$poster.'" class="img-thumbnail" /></p>';
            }
        $output .= "</div>";
        echo $output;
    }
}
?>