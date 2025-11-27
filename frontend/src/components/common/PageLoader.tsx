import React from 'react';
import { LoadingSpinner } from '../ui';

interface PageLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  text = 'Đang tải...', 
  size = 'lg' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size={size} text={text} />
    </div>
  );
};

export default PageLoader;
