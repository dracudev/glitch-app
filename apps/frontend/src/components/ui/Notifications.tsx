import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  $notifications,
  dismissNotification,
  type NotificationEntry,
  type NotificationTone,
} from '@/stores/notifications';

// Tone styling
const TONE_ICON: Record<NotificationTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
};

const TONE_COLOR: Record<NotificationTone, string> = {
  info: 'text-foreground-secondary',
  success: 'text-success',
  error: 'text-error',
};

const DEFAULT_DURATION = 6000;

// Single notification
function NotificationItem({ notification }: { notification: NotificationEntry }) {
  const {
    id,
    title,
    tone = 'info',
    action,
    duration = DEFAULT_DURATION,
  } = notification;

  const [settled, setSettled] = useState(false);
  const [paused, setPaused] = useState(false);

  // Transform-only entrance so a missed animation can never hide the notice.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-dismiss pauses on hover/focus; unpausing restarts the full duration rather than resuming the remainder.
  useEffect(() => {
    if (paused || duration <= 0) return;
    const timer = setTimeout(() => dismissNotification(id), duration);
    return () => clearTimeout(timer);
  }, [paused, duration, id]);

  const Icon = TONE_ICON[tone];

  return (
    <li
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card px-3.5 py-3 shadow-lg transition-transform duration-200 motion-reduce:transition-none"
      style={{ transform: settled ? 'translateY(0)' : 'translateY(-6px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Icon
        size={16}
        strokeWidth={1.75}
        className={`mt-0.5 shrink-0 ${TONE_COLOR[tone]}`}
        aria-hidden="true"
      />

      <p className="min-w-0 flex-1 text-sm leading-5 text-foreground">{title}</p>

      {action && (
        <Button
          asChild
          variant="secondary"
          size="sm"
          // The secondary fill matches the notice surface; lift one tonal step for contrast.
          className="shrink-0 bg-muted hover:bg-secondary-hover"
        >
          <a href={action.href}>{action.label}</a>
        </Button>
      )}

      <button
        type="button"
        onClick={() => dismissNotification(id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <X size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  );
}

// Notification stack
/** Global notification stack, top-right below the 64px navbar. */
export default function Notifications() {
  const notifications = useStore($notifications);

  return (
    <ul
      className="pointer-events-none fixed top-20 right-4 z-toast flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6"
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </ul>
  );
}
