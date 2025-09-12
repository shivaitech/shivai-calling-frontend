import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleAuth, clearError } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      console.log('GoogleCallback loaded with:', { 
        hasCode: !!code, 
        error,
        fullUrl: window.location.href 
      });

      if (error) {
        console.error('OAuth error from URL:', error);
        navigate('/landing?error=oauth_failed');
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        navigate('/landing?error=no_code');
        return;
      }

      try {
        console.log('Processing Google auth with code...');
        clearError(); // Clear any previous errors
        
        await googleAuth(code);
        console.log('Google auth successful, redirecting to dashboard...');
        
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
        
      } catch (error: any) {
        console.error('Google auth failed:', error);
        
        // Clear any stored auth data on failure
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        
        // Navigate with specific error message
        const errorMessage = error.response?.data?.message || error.message || 'oauth_failed';
        navigate(`/landing?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleGoogleCallback();
  }, [searchParams, googleAuth, navigate, clearError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google authentication...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we redirect you...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
