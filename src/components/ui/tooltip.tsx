import * as React from 'react';
import { cn } from '../../lib/utils';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn('inline-flex items-center justify-center', className)}
    {...props}
  >
    {children}
  </button>
));
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ className, side = 'top', children, ...props }, ref) => {
  const context = React.useContext(TooltipContext);
  if (!context?.open) return null;

  const sideClasses = {
    top: 'bottom-full mb-1.5 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
    left: 'right-full mr-1.5 top-1/2 -translate-y-1/2',
    right: 'left-full ml-1.5 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        'absolute z-50 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-fade-in pointer-events-none',
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = 'TooltipContent';
