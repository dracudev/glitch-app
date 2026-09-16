import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './Button';

/**
 * ThemeToggle — a plain icon button, not a sliding sun/moon pill.
 *
 * Dark is the product default, so an absent preference resolves to dark; light
 * is opt-in. The `<html>` class is applied by the inline script in BaseLayout
 * before first paint — this component only reads it back and flips it.
 */
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
