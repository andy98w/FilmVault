import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getRatingColorClass } from '../components/MovieCard';

// API base URL
const API_URL = 'http://localhost:5001';

interface KnownForCredit {
  id: number;
  title: string;
  poster_path: string;
  media_type: string;
  character: string;
  release_date: string;
  vote_average?: number;
}

interface Person {
  id: number;
  name: string;
  profile_path: string;
  biography: string;
  birthday: string;
  deathday: string | null;
  place_of_birth: string;
  gender: string;
  known_for_department: string;
  popularity: number;
  knownFor: KnownForCredit[];
}

const PersonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchPersonDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/movies/person/${id}`);
        setPerson(response.data);
      } catch (err) {
        console.error('Error fetching person details:', err);
        setError('Failed to load person details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonDetails();
  }, [id]);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const calculateAge = (birthday: string, deathday: string | null) => {
    if (!birthday) return null;
    
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const extractYearFromDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };
  
  if (loading) {
    return (
      <div className="container">
        <div style={{ marginTop: '120px' }}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading person details...</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !person) {
    return (
      <div className="container">
        <div style={{ marginTop: '120px', textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error || 'Failed to load person details'}</p>
          <Link to="/">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  const profileUrl = person.profile_path 
    ? `https://image.tmdb.org/t/p/w300${person.profile_path}` 
    : undefined;
  
  const age = calculateAge(person.birthday, person.deathday);
  
  return (
    <div className="person-details-page">
      <div className="container">
        <div className="person-details-content">
          <div className="person-details-header">
            <div className="person-photo-container">
              {person.profile_path ? (
                <img 
                  src={profileUrl} 
                  alt={person.name} 
                  className="person-details-photo" 
                />
              ) : (
                <div className="person-details-no-photo">
                  <span style={{ fontSize: '42px', marginBottom: '20px' }}>👤</span>
                  <p>No photo available</p>
                </div>
              )}
            </div>
            
            <div className="person-info">
              <h1>{person.name}</h1>
              
              <div className="person-meta">
                <div className="meta-item">
                  <span className="meta-title">Born:</span> 
                  <span>{formatDate(person.birthday)}</span>
                  {age && <span> ({age} years old)</span>}
                </div>
                
                {person.deathday && (
                  <div className="meta-item">
                    <span className="meta-title">Died:</span> 
                    <span>{formatDate(person.deathday)}</span>
                  </div>
                )}
                
                {person.place_of_birth && (
                  <div className="meta-item">
                    <span className="meta-title">Birthplace:</span> 
                    <span>{person.place_of_birth}</span>
                  </div>
                )}
                
                <div className="meta-item">
                  <span className="meta-title">Gender:</span> 
                  <span>{person.gender}</span>
                </div>
              </div>
              
              {person.biography && (
                <div className="person-biography">
                  <h3>Biography</h3>
                  <p>{person.biography}</p>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ height: '30px', clear: 'both' }}></div>
          
          {person.knownFor && person.knownFor.length > 0 && (
            <div className="known-for-section">
              <h2>Known For</h2>
              <div className="horizontal-slider">
                {person.knownFor.map(credit => (
                  <Link 
                    to={`/${credit.media_type === 'tv' ? 'tv' : 'movie'}/${credit.id}`} 
                    key={`${credit.id}-${credit.character}`}
                    className="known-for-card"
                  >
                    <div className="poster-wrapper">
                      {credit.poster_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`} 
                          alt={credit.title} 
                          className="movie-poster"
                        />
                      ) : (
                        <div className="no-poster">
                          <div>
                            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>
                              {credit.media_type === 'tv' ? '📺' : '🎬'}
                            </span>
                            No image<br />available
                          </div>
                        </div>
                      )}
                      
                      {/* Media type badge */}
                      {credit.media_type && (
                        <div 
                          className="media-type-badge top-right"
                          title={credit.media_type === 'tv' ? 'TV Show' : 'Movie'}
                        >
                          {credit.media_type === 'tv' ? 'TV' : 'MOVIE'}
                        </div>
                      )}
                      
                      {credit.vote_average !== undefined && credit.vote_average > 0 && (
                        <div 
                          className={`rating-circle ${getRatingColorClass(credit.vote_average)}`}
                          title={`${credit.vote_average.toFixed(1)}/10`}
                          style={{ bottom: '5px', left: '5px' }}
                        >
                          {credit.vote_average.toFixed(1)}
                        </div>
                      )}
                    </div>
                    
                    <div className="card-info">
                      <div className="tooltip-container">
                        <h3 className="movie-title">{credit.title}</h3>
                        <span className="tooltip-text">{credit.title}</span>
                      </div>
                      {credit.release_date && (
                        <div className="release-date">
                          {new Date(credit.release_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {credit.character && (
                        <div className="tooltip-container">
                          <div className="character-name">as {credit.character}</div>
                          <span className="tooltip-text">as {credit.character}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonDetails;