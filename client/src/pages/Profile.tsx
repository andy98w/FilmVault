import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/config';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  
  // Profile picture state
  const [profilePic, setProfilePic] = useState<string | undefined>(user?.profilePic);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // User profile state
  const [biography, setBiography] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  
  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/users/me`, {
          withCredentials: true
        });
        
        setProfilePic(response.data.ProfilePic);
        setBiography(response.data.Biography || '');
        setFacebookLink(response.data.FacebookLink || '');
        setInstagramLink(response.data.InstagramLink || '');
        setYoutubeLink(response.data.YoutubeLink || '');
        setGithubLink(response.data.GithubLink || '');
        setLinkedinLink(response.data.LinkedInLink || '');
      } catch (err) {
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  
  // Handle profile picture file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image is too large. Maximum size is 5MB.');
        return;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.');
        return;
      }
      
      setSelectedFile(file);
      setProfilePic(URL.createObjectURL(file));
    }
  };
  
  // Handle profile picture upload
  const handleProfilePictureUpload = async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }
    
    setUploadingPicture(true);
    setError('');
    setMessage('');
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
      
      const response = await axios.post(
        `${API_URL}/api/users/upload-profile-picture`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Add cache-busting parameter
      const profilePicUrl = response.data.profilePicUrl;
      const timestamp = Date.now();
      const profilePicWithCacheBuster = profilePicUrl.includes('?') 
        ? `${profilePicUrl}&_cb=${timestamp}` 
        : `${profilePicUrl}?_cb=${timestamp}`;
      
      const img = new Image();
      img.onload = () => setProfilePic(profilePicWithCacheBuster);
      img.onerror = () => setProfilePic(profilePicUrl);
      img.src = profilePicWithCacheBuster;
      
      setMessage('Profile picture updated successfully');
      setSelectedFile(null);
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploadingPicture(false);
    }
  };
  
  // Handle profile picture removal
  const handleRemoveProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }
    
    setUploadingPicture(true);
    setError('');
    setMessage('');
    
    try {
      await axios.delete(`${API_URL}/api/users/remove-profile-picture`, {
        withCredentials: true
      });
      
      setProfilePic(undefined);
      setSelectedFile(null);
      setMessage('Profile picture removed successfully');
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove profile picture');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploadingPicture(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await axios.put(
        `${API_URL}/api/users/update`,
        {
          biography,
          facebook_link: facebookLink,
          instagram_link: instagramLink,
          youtube_link: youtubeLink,
          github_link: githubLink,
          linkedin_link: linkedinLink
        },
        { withCredentials: true }
      );
      
      setMessage('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };
  
  // Password change has been replaced with email reset flow

  if (loading && !user) {
    return (
      <div className="container">
        <div style={{ marginTop: '150px', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginBottom: '80px' }}>
      <div className="profile-header">
        <div className="profile-pic-container">
          <img 
            src={profilePic || '/default.jpg'} 
            alt={user?.username || 'Profile'} 
            className="profile-pic-large" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default.jpg';
            }}
            style={{ objectFit: 'cover' }}
          />
          
          {/* Profile picture controls - only visible in edit mode */}
          {editMode && (
            <div className="profile-pic-controls" style={{ position: 'relative' }}>
              {/* Remove profile picture button */}
              {profilePic && !selectedFile && (
                <button
                  onClick={handleRemoveProfilePicture}
                  disabled={uploadingPicture}
                  className="profile-pic-remove-button"
                  title="Remove profile picture"
                  style={{
                    background: 'rgba(255,77,79,0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    position: 'absolute',
                    left: '-5px',
                    bottom: '0',
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  🗑️
                </button>
              )}
              
              {/* Upload controls */}
              <div style={{ position: 'absolute', right: '10px', bottom: '0', zIndex: 10 }}>
                <input
                  type="file"
                  id="profile-picture-upload"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="profile-picture-upload"
                  className="profile-pic-edit-button"
                  title="Change profile picture"
                  style={{ 
                    background: 'rgba(64,169,255,0.9)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  📷
                </label>
                
                {selectedFile && (
                  <button
                    onClick={handleProfilePictureUpload}
                    disabled={uploadingPicture}
                    title="Save profile picture"
                    style={{
                      position: 'absolute',
                      right: '0px',
                      bottom: '40px',
                      background: 'rgba(82,196,26,0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {uploadingPicture ? '⏳' : '💾'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h1 className="profile-username">{user?.username}</h1>
          <p style={{ color: 'var(--primary-color)', opacity: 0.9, margin: '0' }}>{user?.email}</p>
        </div>
      </div>

      {error && (
        <div className="notification notification-error">
          <div className="notification-icon">⚠️</div>
          <div className="notification-content">
            <div className="notification-title">Error</div>
            <div className="notification-message">{error}</div>
          </div>
        </div>
      )}

      {message && (
        <div className="notification notification-success">
          <div className="notification-icon">✅</div>
          <div className="notification-content">
            <div className="notification-title">Success</div>
            <div className="notification-message">{message}</div>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div style={{ marginTop: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-color)',
            borderBottom: activeTab === 'profile' ? '2px solid var(--primary-color)' : 'none',
            padding: '10px 20px',
            marginRight: '10px',
            cursor: 'pointer',
            fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
            marginLeft: 0,
            marginTop: 0,
            width: 'auto'
          }}
        >
          Profile Information
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'security' ? 'var(--primary-color)' : 'var(--text-color)',
            borderBottom: activeTab === 'security' ? '2px solid var(--primary-color)' : 'none',
            padding: '10px 20px',
            marginRight: '10px',
            cursor: 'pointer',
            fontWeight: activeTab === 'security' ? 'bold' : 'normal',
            marginLeft: 0,
            marginTop: 0,
            width: 'auto'
          }}
        >
          Security
        </button>
      </div>
      
      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Profile Information</h2>
            <button 
              onClick={() => setEditMode(!editMode)}
              style={{ 
                background: 'var(--primary-color)',
                color: 'var(--background-dark)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                margin: 0,
                width: 'auto'
              }}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          
          {editMode ? (
            <form onSubmit={handleProfileUpdate}>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="biography" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>About Me</label>
                <textarea 
                  id="biography"
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '150px', 
                    padding: '12px',
                    background: 'var(--nav-background)',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '8px',
                    color: 'var(--text-color)',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                  placeholder="Write something about yourself..."
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '30px', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Social Media Links</h3>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="facebook" style={{ display: 'block', marginBottom: '8px' }}>
                  <i style={{ marginRight: '8px', color: '#1877F2' }}>📘</i> Facebook
                </label>
                <input 
                  type="url"
                  id="facebook"
                  value={facebookLink}
                  onChange={(e) => setFacebookLink(e.target.value)}
                  placeholder="https://facebook.com/yourusername"
                  style={{ 
                    width: '100%',
                    background: 'var(--nav-background)',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="instagram" style={{ display: 'block', marginBottom: '8px' }}>
                  <i style={{ marginRight: '8px', color: '#C13584' }}>📷</i> Instagram
                </label>
                <input 
                  type="url"
                  id="instagram"
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  style={{ 
                    width: '100%',
                    background: 'var(--nav-background)',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="youtube" style={{ display: 'block', marginBottom: '8px' }}>
                  <i style={{ marginRight: '8px', color: '#FF0000' }}>🎥</i> YouTube
                </label>
                <input 
                  type="url"
                  id="youtube"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/c/yourchannel"
                  style={{ 
                    width: '100%',
                    background: 'var(--nav-background)',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="github" style={{ display: 'block', marginBottom: '8px' }}>
                  <i style={{ marginRight: '8px', color: '#FFFFFF' }}>🐙</i> GitHub
                </label>
                <input 
                  type="url"
                  id="github"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  style={{ 
                    width: '100%',
                    background: 'var(--nav-background)',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label htmlFor="linkedin" style={{ display: 'block', marginBottom: '8px' }}>
                  <i style={{ marginRight: '8px', color: '#0077B5' }}>💼</i> LinkedIn
                </label>
                <input 
                  type="url"
                  id="linkedin"
                  value={linkedinLink}
                  onChange={(e) => setLinkedinLink(e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  style={{ 
                    width: '100%',
                    background: 'var(--nav-background)',
                  }}
                />
              </div>
              
              <button 
                type="submit"
                style={{ 
                  background: 'var(--primary-color)',
                  color: 'var(--background-dark)',
                  marginTop: '10px'
                }}
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>About Me</h3>
              </div>
              <div style={{ 
                background: 'var(--nav-background)', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '30px'
              }}>
                {biography ? (
                  <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{biography}</p>
                ) : (
                  <p style={{ opacity: 0.7, fontStyle: 'italic' }}>No biography provided. Click 'Edit Profile' to add information about yourself.</p>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '30px', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Social Media</h3>
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '20px',
                marginBottom: '30px'
              }}>
                {facebookLink && (
                  <a 
                    href={facebookLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 15px',
                      background: '#1877F2',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>📘</span>
                    Facebook
                  </a>
                )}
                
                {instagramLink && (
                  <a 
                    href={instagramLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 15px',
                      background: 'linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>📷</span>
                    Instagram
                  </a>
                )}
                
                {youtubeLink && (
                  <a 
                    href={youtubeLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 15px',
                      background: '#FF0000',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>🎥</span>
                    YouTube
                  </a>
                )}
                
                {githubLink && (
                  <a 
                    href={githubLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 15px',
                      background: '#24292E',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>🐙</span>
                    GitHub
                  </a>
                )}
                
                {linkedinLink && (
                  <a 
                    href={linkedinLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 15px',
                      background: '#0077B5',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>💼</span>
                    LinkedIn
                  </a>
                )}
                
                {!facebookLink && !instagramLink && !youtubeLink && !githubLink && !linkedinLink && (
                  <p style={{ opacity: 0.7, fontStyle: 'italic' }}>No social media links provided. Click 'Edit Profile' to add your social media profiles.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Security Settings</h2>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Change Password</h3>
            </div>
            
            <div style={{ 
              background: 'var(--nav-background)', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <p style={{ marginBottom: '20px' }}>
                To change your password, we'll send you an email with a secure link.
              </p>
              
              <Link 
                to="/forgot-password" 
                style={{ 
                  display: 'inline-block',
                  background: 'var(--primary-color)',
                  color: 'var(--background-dark)',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}
              >
                Send Password Reset Email
              </Link>
            </div>
          </div>
          
          <div style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#FF6B6B' }}>Account Management</h3>
            </div>
            <button 
              onClick={logout}
              style={{ 
                background: 'rgba(255, 107, 107, 0.1)',
                color: '#FF6B6B',
                border: '1px solid #FF6B6B',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                marginTop: '10px',
                width: 'auto'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;