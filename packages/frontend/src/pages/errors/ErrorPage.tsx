import React from 'react';

export const ErrorPage: React.FC = () => {
  return (
    <div className="p-6 text-center">
      <h1 className="text-4xl font-bold">Error</h1>
      <p className="text-gray-500 mt-2">Something went wrong</p>
    </div>
  );
};
