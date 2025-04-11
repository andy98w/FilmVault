import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  text = 'Loading...', 
  size = 'medium' 
}) => {
  return (
    <div className="loading-container">
      <LoadingSpinner size={size} />
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default LoadingScreen;