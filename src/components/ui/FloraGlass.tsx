import React from 'react';
import { cn } from '@/lib/utils';

interface FloraGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const FloraGlass = React.forwardRef<HTMLDivElement, FloraGlassProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("flora-glass", className)} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

FloraGlass.displayName = "FloraGlass";
