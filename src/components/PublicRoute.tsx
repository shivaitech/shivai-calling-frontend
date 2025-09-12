import React from 'react';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default PublicRoute;