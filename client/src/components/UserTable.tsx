import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  Usernames: string;
  ProfilePic: string;
  movie_count: number;
  rating_count: number;
}

interface UserTableProps {
  users: User[];
}

const UserTable = ({ users }: UserTableProps) => {
  const { user: currentUser } = useAuth();

  // Function to determine the correct profile link
  const getUserProfileLink = (userId: number) => {
    // If this is the current user, link to /profile instead of /user/:id
    if (currentUser && currentUser.id === userId) {
      return '/profile';
    }
    return `/user/${userId}`;
  };

  // Function to return appropriate contribution text
  const getContributionText = (movieCount: number) => {
    return movieCount === 1 ? '1 movie' : `${movieCount} movies`;
  };

  return (
    <div className="contributor-container">
      {users.length > 0 ? (
        <div className="contributor-grid">
          {users.map(user => (
            <Link 
              to={getUserProfileLink(user.id)} 
              key={user.id} 
              className="contributor-card"
            >
              <div className="contributor-avatar">
                <img 
                  src={user.ProfilePic || '/default.jpg'} 
                  alt={user.Usernames} 
                  className="contributor-pic"
                />
                {currentUser && currentUser.id === user.id && (
                  <div className="contributor-badge">You</div>
                )}
              </div>
              <div className="contributor-info">
                <div className="contributor-name">{user.Usernames}</div>
                <div className="contributor-stat">
                  {getContributionText(user.movie_count)} added
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>No users found</p>
      )}
    </div>
  );
};

export default UserTable;