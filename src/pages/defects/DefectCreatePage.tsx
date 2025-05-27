import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import SubmitDefectForm from '../../components/defects/SubmitDefectForm';

const DefectCreatePage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link to="/defects" className="text-primary hover:text-blue-700 mr-4">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Submit New Bug</h1>
        </div>
        <p className="mt-2 text-sm text-gray-700">
          Please provide as much information as possible to help us resolve the issue.
        </p>
      </div>
      
      <SubmitDefectForm />
    </div>
  );
};

export default DefectCreatePage; 