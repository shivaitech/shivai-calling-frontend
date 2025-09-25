import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  smooth?: boolean;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ smooth = true }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } catch (error) {
      // Fallback for older browsers that don't support smooth scrolling
      window.scrollTo(0, 0);
    }
  }, [pathname, smooth]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;