import React from 'react';

interface LoaderProps {
    fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = true }) => {
    return (
        <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
};

export default Loader;
