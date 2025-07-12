import React from 'react';
import { useOAuthCallback } from '@/hooks/useOAuthCallback';

interface OAuthWrapperProps {
  children: React.ReactNode;
}

const OAuthWrapper: React.FC<OAuthWrapperProps> = ({ children }) => {
  // Handle OAuth callbacks globally
  useOAuthCallback();
  
  return <>{children}</>;
};

export default OAuthWrapper;