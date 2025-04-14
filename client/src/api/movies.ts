import axiosInstance from './config';

// Movie related API calls
export const getMovieDetails = (id: string | number) => {
  return axiosInstance.get(`/api/movies/details/${id}`);
};

export const getTVDetails = (id: string | number) => {
  return axiosInstance.get(`/api/movies/details/${id}?type=tv`);
};

export const getPersonDetails = (id: string | number) => {
  return axiosInstance.get(`/api/movies/person/${id}`);
};

export const getUserMovies = () => {
  return axiosInstance.get(`/api/movies/user/list`);
};

export const getMovieSearch = (query: string, page: number = 1) => {
  return axiosInstance.get(`/api/movies/search?query=${encodeURIComponent(query)}&page=${page}`);
};

export const addToUserList = (movieData: {
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  overview: string;
}) => {
  return axiosInstance.post(`/api/movies/add`, movieData);
};

export const removeFromUserList = (movieId: number | string) => {
  return axiosInstance.delete(`/api/movies/remove/${movieId}`);
};

export const rateMovie = (movieId: number | string, rating: number) => {
  // Ensure the rating is an integer between 0 and 100
  const validRating = Math.max(0, Math.min(100, Math.round(rating)));
  
  return axiosInstance.post(`/api/movies/rate`, { movie_id: movieId, rating: validRating });
};

export const getTrending = () => {
  return axiosInstance.get(`/api/movies/top-rated`);
};

export const getPopular = () => {
  return axiosInstance.get(`/api/movies/top`);
};

export const getTopRated = () => {
  return axiosInstance.get(`/api/movies/top-rated`);
};