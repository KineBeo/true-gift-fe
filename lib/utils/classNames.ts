/**
 * Combines multiple class names into a single string, filtering out falsy values
 * @param classes List of class names or expressions that evaluate to class names
 * @returns Combined class names as a single string
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
} 