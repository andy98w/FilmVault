import { Link } from 'react-router-dom';

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
  return (
    <div className="table-container">
      {users.length > 0 ? (
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th className="right-align">Movies Added</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <Link to={`/user/${user.id}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                      src={user.ProfilePic || '/default.jpg'} 
                      alt={user.Usernames} 
                      className="profile-pic" 
                      style={{ width: '25px', height: '25px', marginRight: '10px' }}
                    />
                    {user.Usernames}
                  </Link>
                </td>
                <td className="right-align">{user.movie_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No users found</p>
      )}
    </div>
  );
};

export default UserTable;