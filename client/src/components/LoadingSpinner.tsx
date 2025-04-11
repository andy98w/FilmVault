import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'var(--primary-color)' 
}) => {
  // Determine spinner size based on prop
  const getSize = () => {
    switch (size) {
      case 'small': return '30px';
      case 'large': return '70px';
      case 'medium':
      default: return '50px';
    }
  };

  const spinnerSize = getSize();

  return (
    <div 
      className="loading-spinner" 
      style={{ 
        width: spinnerSize, 
        height: spinnerSize,
        borderColor: `${color} transparent transparent transparent`
      }}
    ></div>
  );
};

export default LoadingSpinner;