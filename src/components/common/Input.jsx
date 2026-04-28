import React from 'react';

export const Input = ({ label, id, error, className = '', ...props }) => {
    return (
        <div className="flex flex-col mb-4">
            {label && (
                <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input 
                id={id} 
                className={`px-3 py-2 bg-white border shadow-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`} 
                {...props} 
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};
