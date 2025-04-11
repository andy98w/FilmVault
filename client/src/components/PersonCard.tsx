import { useNavigate } from 'react-router-dom';

interface KnownForItem {
  id: number;
  title: string;
  media_type: string;
}

interface Person {
  id: number;
  name: string;
  profile_path: string;
  known_for_department: string;
  popularity: number;
  gender: string;
  known_for: KnownForItem[];
}

interface PersonCardProps {
  person: Person;
}

const PersonCard = ({ person }: PersonCardProps) => {
  const navigate = useNavigate();
  
  const profileUrl = person.profile_path 
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}` 
    : undefined;
  
  return (
    <div className="person-card" onClick={() => navigate(`/person/${person.id}`)}>
      <div className="person-card-clickable">
        {person.profile_path ? (
          <img src={profileUrl} alt={person.name} />
        ) : (
          <div className="no-image-placeholder">
            <div>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>👤</span>
              No image<br />available
            </div>
          </div>
        )}
        <div className="tooltip-container">
          <div className="person-card-title">{person.name}</div>
          <span className="tooltip-text">{person.name}</span>
        </div>
      </div>
    </div>
  );
};

export default PersonCard;