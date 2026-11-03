import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel: string;
  registerItem: (value: string, label: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  disabled = false,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [itemLabels, setItemLabels] = React.useState<Record<string, string>>({});
  const selectRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  const registerItem = React.useCallback((val: string, label: string) => {
    setItemLabels((prev) => {
      if (prev[val] === label) return prev;
      return { ...prev, [val]: label };
    });
  }, []);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectedLabel = itemLabels[currentValue] ?? '';

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        registerItem,
        disabled,
      }}
    >
      <div ref={selectRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, id, ...props }, ref) => {
    const { open, setOpen, disabled } = useSelectContext();

    return (
      <button
        ref={ref}
        type="button"
        id={id}
        disabled={disabled || props.disabled}
        onClick={() => !disabled && setOpen(!open)}
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'hover:bg-accent/40 transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        <div className="flex-1 text-left truncate">{children}</div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ml-2',
            open && 'rotate-180 text-foreground'
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder = 'Select an option', className }: SelectValueProps) {
  const { value, selectedLabel } = useSelectContext();

  const displayText = selectedLabel || value;

  return (
    <span className={cn('block truncate', !displayText && 'text-muted-foreground', className)}>
      {displayText || placeholder}
    </span>
  );
}

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
}

export function SelectContent({ className, children }: SelectContentProps) {
  const { open } = useSelectContext();

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute left-0 top-[calc(100%+4px)] z-50 max-h-60 w-full min-w-[8rem] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg',
        'animate-in fade-in-80 zoom-in-95 duration-100',
        className
      )}
    >
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface SelectItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function SelectItem({ value, disabled = false, className, children }: SelectItemProps) {
  const { value: selectedValue, onValueChange, registerItem } = useSelectContext();
  const isSelected = selectedValue === value;

  // Derive text label from children for SelectValue display
  const labelText = typeof children === 'string' ? children : String(children);

  React.useEffect(() => {
    registerItem(value, labelText);
  }, [value, labelText, registerItem]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        if (!disabled) {
          onValueChange(value);
        }
      }}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent/80 font-medium text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
          <Check className="h-4 w-4" />
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}

interface SelectGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectGroup({ children, className }: SelectGroupProps) {
  return <div className={cn('p-1', className)}>{children}</div>;
}

interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectLabel({ children, className }: SelectLabelProps) {
  return (
    <div className={cn('px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground', className)}>
      {children}
    </div>
  );
}
