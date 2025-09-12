import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleAuth } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      console.log('Google callback received, code:', code); // Debug log

      if (error) {
        console.error('Google OAuth error:', error);
        navigate('/landing?error=oauth_failed');
        return;
      }

      if (code) {
        try {
          console.log('Processing Google auth...');
          await googleAuth(code);
          console.log('Google auth successful, redirecting...');
          
          // Force redirect to dashboard
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('Google auth failed:', error);
          navigate('/landing?error=oauth_failed');
        }
      } else {
        navigate('/landing');
      }
    };

    handleGoogleCallback();
  }, [searchParams, googleAuth, navigate]);

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
