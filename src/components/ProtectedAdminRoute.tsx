import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import LoadingSpinner from './ui/loading-spinner';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAdminStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Verifying admin access..." />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
