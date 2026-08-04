import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FaunaProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  // Strategy for mobile degradation
  mobileStrategy?: 'hide' | 'scale-down' | 'reposition';
  // Optional explicit mobile class when using 'reposition'
  mobileClassName?: string;
}

export const Fauna = ({ 
  src, 
  alt, 
  className, 
  width = 500, 
  height = 500, 
  priority = false,
  mobileStrategy = 'hide',
  mobileClassName
}: FaunaProps) => {
  
  // Resolve base mobile visibility classes
  const getMobileClasses = () => {
    switch (mobileStrategy) {
      case 'hide':
        return 'hidden md:block';
      case 'scale-down':
        return 'scale-50 md:scale-100 origin-bottom-right'; // Examples, can be tweaked
      case 'reposition':
        return mobileClassName || '';
      default:
        return 'hidden md:block';
    }
  };

  return (
    <div className={cn('fauna-anchored select-none', getMobileClasses(), className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        quality={85} // Good balance of quality/size for complex transparent PNGs/WebPs
        className="w-full h-auto object-contain drop-shadow-2xl"
      />
    </div>
  );
};
