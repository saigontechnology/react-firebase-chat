import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * Returns the debounced value that only updates after the specified delay.
 * Matching rn-firebase-chat implementation.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
