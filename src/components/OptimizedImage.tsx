import { ImgHTMLAttributes, useState } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  className?: string;
  lazy?: boolean;
}

/**
 * OptimizedImage component with WebP support and lazy loading
 * Automatically uses WebP format when available, falls back to original format
 */
export default function OptimizedImage({
  src,
  webpSrc,
  alt,
  className = '',
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Convert .png/.jpg to .webp automatically if webpSrc not provided
  const defaultWebpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const webpSource = webpSrc || defaultWebpSrc;

  return (
    <picture>
      {/* WebP format for modern browsers (80%+ smaller) */}
      <source srcSet={webpSource} type="image/webp" />
      
      {/* Original format as fallback */}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...props}
      />
    </picture>
  );
}
