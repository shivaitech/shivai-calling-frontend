import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleAuth, clearError, error } = useAuth();
  
  // Prevent multiple executions
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      console.log('GoogleCallback: Already processed, skipping...');
      return;
    }

    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      console.log('GoogleCallback: Processing callback', {
        hasCode: !!code,
        hasError: !!errorParam,
        url: window.location.href
      });

      if (errorParam) {
        console.error('OAuth error from URL:', errorParam);
        navigate('/landing?error=oauth_failed', { replace: true });
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        navigate('/landing?error=no_code', { replace: true });
        return;
      }

      // Mark as processed immediately to prevent duplicate processing
      hasProcessed.current = true;
      
      try {
        clearError();
        console.log('GoogleCallback: Calling googleAuth...');
        
        await googleAuth(code);
        
        console.log('GoogleCallback: Success! Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
        
      } catch (error: any) {
        console.error('GoogleCallback: Authentication failed:', error);
        
        // Navigate to landing with error message
        const errorMessage = error.message || 'Authentication failed';
        navigate(`/landing?error=${encodeURIComponent(errorMessage)}`, { replace: true });
      }
    };

    handleGoogleCallback();
  }, []); // Empty dependencies - run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google authentication...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we redirect you...</p>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
