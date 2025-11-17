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
    if (hasProcessed.current) {
      return;
    }

    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        navigate('/landing?error=oauth_failed', { replace: true });
        return;
      }

      if (!code) {
        navigate('/landing?error=no_code', { replace: true });
        return;
      }

      hasProcessed.current = true;
      
      try {
        clearError();
        await googleAuth(code);
        navigate('/dashboard', { replace: true });
      } catch (error: any) {
        const errorMessage = error.message || 'Authentication failed';
        navigate(`/landing?error=${encodeURIComponent(errorMessage)}`, { replace: true });
      }
    };

    handleGoogleCallback();
  }, []);

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
