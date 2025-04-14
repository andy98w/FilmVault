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
  return axiosInstance.post(`/api/movies/rate`, { movie_id: movieId, rating });
};

// Use top-rated instead of trending since there's no trending endpoint in the API
export const getTrending = () => {
  return axiosInstance.get(`/api/movies/top-rated`);
};

// Use top since there's no popular endpoint in the API
export const getPopular = () => {
  return axiosInstance.get(`/api/movies/top`);
};

export const getTopRated = () => {
  return axiosInstance.get(`/api/movies/top-rated`);
};