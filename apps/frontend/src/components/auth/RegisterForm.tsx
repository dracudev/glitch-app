import { useState } from 'react';
import * as Form from '@radix-ui/react-form';
import type { RegisterRequest } from '@glitch/shared-types';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  redirectTo?: string;
  className?: string;
}

export default function RegisterForm({ redirectTo = '/feed', className = '' }: RegisterFormProps) {
  const { register, isLoading, error, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
  });

  const handleBlur = (field: 'email' | 'username' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Mark all fields as touched on submit
    setTouched({ email: true, username: true, password: true });

    clearError();

    const formData = new FormData(event.currentTarget);
    const data: RegisterRequest = {
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };

    try {
      await register(data);
      window.location.href = redirectTo;
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <Card className={`p-6 sm:p-8 ${className}`}>
      <Form.Root onSubmit={handleSubmit} className="space-y-6">
        {/* Global auth error from $authError store */}
        {error && (
          <div
            role="alert"
            className="rounded-md p-4 border bg-state-error/10 border-state-error/20"
          >
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-state-error">Registration Error</h3>
                <div className="mt-2 text-sm text-state-error/80">{error}</div>
                <Button
                  type="button"
                  onClick={clearError}
                  variant="link"
                  size="sm"
                  className="mt-2 text-state-error hover:text-state-error/80 p-0 h-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Email field */}
        <Form.Field name="email" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-[var(--text-primary)]">
            Email address
          </Form.Label>

          <Form.Control asChild>
            <input
              type="email"
              autoComplete="email"
              required
              onBlur={() => handleBlur('email')}
              className="appearance-none block w-full px-3 py-2 border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] rounded-md shadow-sm text-sm transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email"
            />
          </Form.Control>

          {touched.email && (
            <>
              <Form.Message match="valueMissing" className="text-sm text-state-error">
                Email is required
              </Form.Message>

              <Form.Message match="typeMismatch" className="text-sm text-state-error">
                Please provide a valid email address
              </Form.Message>
            </>
          )}
        </Form.Field>

        {/* Username field */}
        <Form.Field name="username" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-[var(--text-primary)]">
            Username
          </Form.Label>

          <Form.Control asChild>
            <input
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_\-]+$"
              onBlur={() => handleBlur('username')}
              className="appearance-none block w-full px-3 py-2 border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] rounded-md shadow-sm text-sm transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Choose a username"
            />
          </Form.Control>

          {touched.username && (
            <>
              <Form.Message match="valueMissing" className="text-sm text-state-error">
                Username is required
              </Form.Message>

              <Form.Message match="tooShort" className="text-sm text-state-error">
                Username must be at least 3 characters
              </Form.Message>

              <Form.Message match="tooLong" className="text-sm text-state-error">
                Username must not exceed 30 characters
              </Form.Message>

              <Form.Message match="patternMismatch" className="text-sm text-state-error">
                Username can only contain letters, numbers, underscores, and hyphens
              </Form.Message>
            </>
          )}

          <p className="text-xs text-[var(--text-secondary)]">
            3-30 characters. Letters, numbers, underscores, and hyphens only.
          </p>
        </Form.Field>

        {/* Password field */}
        <Form.Field name="password" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-[var(--text-primary)]">
            Password
          </Form.Label>

          <div className="relative">
            <Form.Control asChild>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?]+$"
                onBlur={() => handleBlur('password')}
                className="appearance-none block w-full px-3 py-2 pr-11 border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] rounded-md shadow-sm text-sm transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Create a strong password"
              />
            </Form.Control>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 hover:bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {touched.password && (
            <>
              <Form.Message match="valueMissing" className="text-sm text-state-error">
                Password is required
              </Form.Message>

              <Form.Message match="tooShort" className="text-sm text-state-error">
                Password must be at least 8 characters
              </Form.Message>

              <Form.Message match="patternMismatch" className="text-sm text-state-error">
                Password must contain at least one uppercase letter, one lowercase letter, one
                number and one special character
              </Form.Message>
            </>
          )}

          {!touched.password && (
            <div className="text-xs text-[var(--text-muted)] space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>
          )}
        </Form.Field>

        {/* Terms and Privacy Policy */}
        <div className="flex items-start space-x-3">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded text-[var(--brand-primary)] border-[var(--bg-tertiary)] bg-[var(--bg-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-colors"
            />
          </div>
          <div className="text-sm">
            <label htmlFor="terms" className="text-[var(--text-secondary)]">
              I agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--brand-primary)] hover:text-[var(--brand-accent)] transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--brand-primary)] hover:text-[var(--brand-accent)] transition-colors"
              >
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <Form.Submit asChild>
          <Button type="submit" isLoading={isLoading} fullWidth>
            Create account
          </Button>
        </Form.Submit>
      </Form.Root>
    </Card>
  );
}
