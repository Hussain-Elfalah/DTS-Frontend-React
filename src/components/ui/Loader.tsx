import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', fullScreen = false }) => {
  // Define size classes
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  // Define container classes
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50'
    : 'flex items-center justify-center py-4';

  return (
    <div className={containerClasses}>
      <div
        className={`${sizeClasses[size]} rounded-full border-t-primary border-r-primary border-b-gray-200 border-l-gray-200 animate-spin`}
      ></div>
    </div>
  );
};

export default Loader; 