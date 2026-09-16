import { useState, useEffect } from 'react';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { useStore } from '@nanostores/react';
import {
  $currentUser,
  $isAuthenticated,
  initializeAuthState,
  getUserAvatarUrl,
} from '@/stores/auth';
import { logout } from '@/services/auth';
import ThemeToggle from './ThemeToggle';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from './Dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';

interface NavbarProps {
  currentPath?: string;
}

interface NavigationItem {
  label: string;
  href: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Games', href: '/games' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Feed', href: '/feed' },
];

const dropdownItem =
  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus:bg-secondary focus:text-foreground';

/**
 * Main navigation bar.
 *
 * Layout is a three-column grid (`1fr / auto / 1fr`) rather than
 * `justify-between`, which is what makes the nav links land on the true page
 * centre instead of the centre of whatever space is left over.
 */
export default function Navbar({ currentPath }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    initializeAuthState();
    setAuthInitialized(true);
  }, []);

  const currentUser = useStore($currentUser);
  const isAuthenticated = useStore($isAuthenticated);

  const user = currentUser
    ? { username: currentUser.username, avatar: currentUser.avatar }
    : undefined;

  const isActiveRoute = (href: string) => {
    if (!currentPath) return false;
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-nav h-16 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="shell grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left — brand */}
        <a
          href="/"
          className="col-start-1 flex items-center gap-2 text-foreground transition-colors hover:text-accent"
          aria-label="Glitch home"
        >
          <img src="/images/glitch-mark.svg" alt="" width={32} height={32} className="size-8" />
          <span className="font-display text-lg font-semibold tracking-tight">Glitch</span>
        </a>

        {/* Centre — primary navigation, centred on the page. col-start-2 is
            explicit so that hiding this list on mobile does not let the
            utilities block slide into its column. */}
        <ul className="col-start-2 hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-9 items-center rounded-md px-3 text-sm transition-colors ${
                    isActive
                      ? 'font-semibold text-primary'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Right — utilities */}
        <div className="col-start-3 flex items-center justify-end gap-2">
          <ThemeToggle />

          <div className="hidden items-center gap-2 lg:flex">
            {authInitialized ? (
              isAuthenticated && user ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="flex rounded-full transition-opacity hover:opacity-85"
                      aria-label="Account menu"
                    >
                      <Avatar.Root className="inline-flex size-8 select-none items-center justify-center overflow-hidden rounded-full">
                        <Avatar.Image
                          src={getUserAvatarUrl(40)}
                          alt={user.username}
                          width={32}
                          height={32}
                          className="size-full object-cover"
                        />
                      </Avatar.Root>
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-popover min-w-48 rounded-lg border border-border bg-popover p-1 text-foreground shadow-lg"
                      sideOffset={8}
                      align="end"
                    >
                      <DropdownMenu.Item className={dropdownItem} asChild>
                        <a href={`/profile/${user.username}`}>
                          <User className="size-4" />
                          <span>Profile</span>
                        </a>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item className={dropdownItem} asChild>
                        <a href="/settings">
                          <Settings className="size-4" />
                          <span>Settings</span>
                        </a>
                      </DropdownMenu.Item>

                      <DropdownMenu.Separator className="my-1 h-px bg-border" />

                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-error outline-none transition-colors hover:bg-error/10 focus:bg-error/10"
                        onSelect={handleLogout}
                      >
                        <LogOut className="size-4" />
                        <span>Logout</span>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <>
                  <a
                    href="/auth/login"
                    className="flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Log in
                  </a>
                  <a
                    href="/auth/signup"
                    className="flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    Sign up
                  </a>
                </>
              )
            ) : (
              <div className="h-9 w-40" aria-hidden="true" />
            )}
          </div>

          {/* Mobile trigger */}
          <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </button>
            </DialogTrigger>

            <DialogContent placement="right" aria-describedby={undefined}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border p-4 pr-14">
                  <DialogTitle>Menu</DialogTitle>
                </div>

                <nav className="p-3">
                  <ul className="space-y-1">
                    {navigationItems.map((item) => {
                      const isActive = isActiveRoute(item.href);
                      return (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center rounded-md px-3 py-2.5 text-base transition-colors ${
                              isActive
                                ? 'font-semibold text-primary'
                                : 'font-medium text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                          >
                            {item.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="mt-auto border-t border-border p-3">
                  {authInitialized ? (
                    isAuthenticated && user ? (
                      <div className="space-y-2">
                        <a
                          href={`/profile/${user.username}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-secondary"
                        >
                          <Avatar.Root className="inline-flex size-10 select-none items-center justify-center overflow-hidden rounded-full">
                            <Avatar.Image
                              src={getUserAvatarUrl(64)}
                              alt={user.username}
                              width={40}
                              height={40}
                              className="size-full object-cover"
                            />
                          </Avatar.Root>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {user.username}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              View profile
                            </span>
                          </span>
                        </a>

                        <a
                          href="/settings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={dropdownItem}
                        >
                          <Settings className="size-4" />
                          <span>Settings</span>
                        </a>

                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-error transition-colors hover:bg-error/10"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="size-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <a
                          href="/auth/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex h-10 w-full items-center justify-center rounded-md border border-border text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          Log in
                        </a>
                        <a
                          href="/auth/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                        >
                          Sign up
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="h-24" aria-hidden="true" />
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
}
