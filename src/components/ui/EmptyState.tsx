import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "w-full flex flex-col items-center justify-center text-center p-12",
      "flora-glass border-dashed border-bone/20",
      className
    )}>
      {/* Tactical Crosshairs Decoration */}
      <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-bone/30"></div>
      <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-bone/30"></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-bone/30"></div>
      <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-bone/30"></div>

      <div className="mb-6 text-bone/40">
        {icon || (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        )}
      </div>
      
      <h3 className="font-fraunces text-2xl font-bold text-bone mb-2">
        {title}
      </h3>
      
      <p className="font-geist text-sm text-bone/60 font-light max-w-sm mb-8 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button 
          variant="outline" 
          onClick={onAction}
          className="border-bone/30 text-bone hover:bg-bone hover:text-obsidian uppercase tracking-widest text-[10px] font-bold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
