import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  direction = 'left',
  duration = 0.4
}) => {
  const [isActive, setIsActive] = useState(false);
  
  // Determine class based on direction
  const getDirectionClass = () => {
    switch(direction) {
      case 'right': return 'slide-right';
      case 'up': return 'slide-up';
      case 'down': return 'slide-down';
      case 'left':
      default: return 'slide-left';
    }
  };
  
  useEffect(() => {
    // Trigger animation after component is mounted
    const timer = setTimeout(() => {
      setIsActive(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`page-transition ${getDirectionClass()} ${isActive ? 'active' : ''}`}
      style={{ transitionDuration: `${duration}s` }}
    >
      {children}
    </div>
  );
};

export default PageTransition;