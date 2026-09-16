import { atom } from 'nanostores';

// ============================================================================
// Notifications State
// ============================================================================

export type NotificationTone = 'info' | 'success' | 'error';

export interface AppNotification {
  /** Short, terse line. Say less. */
  title: string;
  tone?: NotificationTone;
  /** A real link, rendered as a button. Omit when there is nothing to do. */
  action?: { label: string; href: string };
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration?: number;
}

export interface NotificationEntry extends AppNotification {
  id: string;
}

/**
 * Currently visible notifications, oldest first.
 */
export const $notifications = atom<NotificationEntry[]>([]);

let sequence = 0;

/**
 * Show a notification. Returns its id.
 *
 * @example
 * ```ts
 * notify({ title: 'Sign in to follow people', action: { label: 'Sign in', href: '/auth/login' } });
 * ```
 */
export function notify(notification: AppNotification): string {
  const id = `notification-${++sequence}`;
  $notifications.set([...$notifications.get(), { ...notification, id }]);
  return id;
}

export function dismissNotification(id: string): void {
  $notifications.set($notifications.get().filter((entry) => entry.id !== id));
}

export function clearNotifications(): void {
  $notifications.set([]);
}
