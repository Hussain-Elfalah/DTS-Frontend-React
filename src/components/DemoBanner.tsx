import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const DemoBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-center relative">
      <div className="flex items-center justify-center space-x-2">
        <InformationCircleIcon className="h-5 w-5" />
        <span className="font-medium">
          🚀 Demo Mode - This is a demonstration version using mock data
        </span>
      </div>
      <div className="text-xs mt-1 opacity-90">
        All data is simulated and changes won't be saved. Experience the full UI/UX without backend dependencies.
      </div>
    </div>
  );
};

export default DemoBanner; 