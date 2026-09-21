import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any value by a specified delay in milliseconds.
 * Useful for fast reactive search inputs to avoid re-filtering or re-fetching on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
