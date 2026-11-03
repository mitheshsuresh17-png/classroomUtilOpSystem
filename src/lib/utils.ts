export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

/**
 * Standard Shadcn cn utility to combine and merge class names
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const process = (item: ClassValue) => {
    if (!item) return;
    if (typeof item === 'string' || typeof item === 'number') {
      const parts = String(item).trim().split(/\s+/);
      for (const part of parts) {
        if (part) classes.push(part);
      }
    } else if (Array.isArray(item)) {
      item.forEach(process);
    } else if (typeof item === 'object') {
      for (const [key, val] of Object.entries(item)) {
        if (val) {
          const parts = key.trim().split(/\s+/);
          for (const part of parts) {
            if (part) classes.push(part);
          }
        }
      }
    }
  };

  inputs.forEach(process);
  return classes.join(' ');
}
