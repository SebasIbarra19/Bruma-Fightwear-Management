"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {React.Children.map(children, child => 
          React.isValidElement(child) ? React.cloneElement(child, { onOpenChange } as any) : child
        )}
      </div>
    </div>
  )
}

const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode; onClick?: () => void }> = ({ 
  children, 
  onClick 
}) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {children}
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps & { onOpenChange?: (open: boolean) => void }> = ({ 
  className, 
  children, 
  onOpenChange 
}) => (
  <div className={cn("p-6", className)}>
    <button 
      onClick={() => onOpenChange?.(false)}
      className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
    >
      <span className="text-xl">&times;</span>
    </button>
    {children}
  </div>
)

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
)

const DialogFooter: React.FC<DialogFooterProps> = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)} {...props} />
)

const DialogTitle: React.FC<DialogTitleProps> = ({ className, ...props }) => (
  <h3 className={cn("text-lg font-semibold leading-none", className)} {...props} />
)

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, ...props }) => (
  <p className={cn("text-sm text-gray-600", className)} {...props} />
)

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}