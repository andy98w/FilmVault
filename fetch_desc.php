<?php
require_once('vendor/autoload.php');
$client = new \GuzzleHttp\Client();
$response = $client->request('GET', 'https://api.themoviedb.org/3/movie/640146?language=en-US', [
  'headers' => [
    'Authorization' => 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZDU3Nzc2NGM5NWQwNDI4MmZlNjEwY2VlY2QyNjBjMiIsInN1YiI6IjYzYzM4OTc1ZDdmYmRhMDBjYjdjOGJiYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.cV93GdzptnWje2ANGbgl6YcLO5t30_lNKsxGOTUvK3g',
    'accept' => 'application/json',
  ],
]);
$result = $response->getBody();
$title = $result['original_title'];
$poster = $result['poster_path'];
$desc = $result['overview'];
$poster = "http://image.tmdb.org/t/p/w500/" . $poster;
$output .= '
<p><img src="http://image.tmdb.org/t/p/w500/' . $poster . '" class="img-thumbnail" /></p>';
$output .= $desc;
echo $output;
?>