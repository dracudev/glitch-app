import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './Button';

/** ThemeToggle — dark is the default; BaseLayout's inline script sets the `<html>` class pre-paint and this only reads/flips it. */
export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLight(document.documentElement.classList.contains('light'));
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle('light', next);
    document.documentElement.classList.toggle('dark', !next);
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {
      /* private mode — the theme simply won't persist */
    }
  };

  // Keep the footprint stable before hydration so the header never shifts.
  if (!mounted) {
    return <div className="size-10" aria-hidden="true" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {isLight ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </Button>
  );
}
