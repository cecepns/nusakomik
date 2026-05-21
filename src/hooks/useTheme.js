import { useState, useEffect } from 'react';

function readStoredTheme() {
  const saved = localStorage.getItem('komiknesia-theme');
  if (saved === 'light') return 'light';
  if (saved === 'dark') return 'dark';
  return 'dark';
}

export const useTheme = () => {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    localStorage.setItem('komiknesia-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};