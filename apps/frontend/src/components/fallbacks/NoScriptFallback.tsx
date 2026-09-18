import { TriangleAlert } from 'lucide-react';

interface NoScriptFallbackProps {
  feature: string;
  className?: string;
  message?: string;
}

export default function NoScriptFallback({
  feature,
  className = '',
  message,
}: NoScriptFallbackProps) {
  const defaultMessage = `JavaScript is required for the interactive ${feature}. Please enable JavaScript or contact support for assistance.`;

  return (
    <noscript>
      <div
        className={`mt-4 p-4 rounded-md border bg-warning/10 border-warning/20 ${className}`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <TriangleAlert className="h-5 w-5 text-warning" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-warning">JavaScript Required</h3>
            <div className="mt-2 text-sm text-warning">{message || defaultMessage}</div>
            <div className="mt-3">
              <div className="flex space-x-4 text-xs">
                <a
                  href="/support"
                  className="font-medium text-warning hover:text-warning/80 transition-colors underline"
                >
                  Contact Support
                </a>
                <span className="text-warning/60">•</span>
                <a
                  href="/help/javascript"
                  className="font-medium text-warning hover:text-warning/80 transition-colors underline"
                >
                  Enable JavaScript
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </noscript>
  );
}
