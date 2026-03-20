import { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  className?: string;
  lazy?: boolean;
}

/**
 * OptimizedImage component with WebP support and lazy loading.
 * Does NOT hide the image while loading — that causes layout shifts.
 */
export default function OptimizedImage({
  src,
  webpSrc,
  alt,
  className = '',
  lazy = true,
  ...props
}: OptimizedImageProps) {
  // Convert .png/.jpg to .webp automatically if webpSrc not provided
  const defaultWebpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const webpSource = webpSrc || defaultWebpSrc;

  return (
    <picture>
      {/* WebP format for modern browsers */}
      <source srcSet={webpSource} type="image/webp" />
      {/* Original format as fallback */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={lazy ? 'lazy' : 'eager'}
        decoding={lazy ? 'async' : 'sync'}
        {...props}
      />
    </picture>
  );
}
