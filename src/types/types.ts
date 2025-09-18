// Types for the Hero component
export interface NavigationItem {
  label: string;
  href: string;
}

export interface HeroProps {
  className?: string;
}

export interface AnimationVariants {
  hidden: {
    opacity: number;
    y?: number;
    scale?: number;
    x?: number;
  };
  visible: {
    opacity: number;
    y?: number;
    scale?: number;
    x?: number;
    transition?: {
      duration?: number;
      delay?: number;
      ease?: number[] | string;
      staggerChildren?: number;
      type?: string;
      stiffness?: number;
    };
  };
}