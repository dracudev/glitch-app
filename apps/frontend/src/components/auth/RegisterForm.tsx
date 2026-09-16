import { useState } from 'react';
import * as Form from '@radix-ui/react-form';
import type { RegisterRequest } from '@glitch/shared-types';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
            className="rounded-md p-4 border bg-error/10 border-error/20"
          >
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error">Registration error</h3>
                <div className="mt-2 text-sm text-error/80">{error}</div>
                <Button
                  type="button"
                  onClick={clearError}
                  variant="link"
                  size="sm"
                  className="mt-2 text-error hover:text-error/80 p-0 h-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Email field */}
        <Form.Field name="email" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-foreground">
            Email address
          </Form.Label>

          <Form.Control asChild>
            <Input
              type="email"
              autoComplete="email"
              required
              onBlur={() => handleBlur('email')}
              placeholder="Enter your email"
            />
          </Form.Control>

          {touched.email && (
            <>
              <Form.Message match="valueMissing" className="text-sm text-error">
                Email is required
              </Form.Message>

              <Form.Message match="typeMismatch" className="text-sm text-error">
                Please provide a valid email address
              </Form.Message>
            </>
          )}
        </Form.Field>

        {/* Username field */}
        <Form.Field name="username" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-foreground">
            Username
          </Form.Label>

          <Form.Control asChild>
            <Input
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_\-]+$"
              onBlur={() => handleBlur('username')}
              placeholder="Choose a username"
            />
          </Form.Control>

          {touched.username && (
            <>
              <Form.Message match="valueMissing" className="text-sm text-error">
                Username is required
              </Form.Message>

              <Form.Message match="tooShort" className="text-sm text-error">
                Username must be at least 3 characters
              </Form.Message>

              <Form.Message match="tooLong" className="text-sm text-error">
                Username must not exceed 30 characters
              </Form.Message>

              <Form.Message match="patternMismatch" className="text-sm text-error">
                Username can only contain letters, numbers, underscores, and hyphens
              </Form.Message>
            </>
          )}

          <p className="text-xs text-foreground-secondary">
            3-30 characters. Letters, numbers, underscores, and hyphens only.
          </p>
        </Form.Field>

        {/* Password field */}
        <Form.Field name="password" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-foreground">
            Password
          </Form.Label>

          <div className="relative">
            <Form.Control asChild>
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?]+$"
                onBlur={() => handleBlur('password')}
                className="pr-11"
                placeholder="Create a strong password"
              />
            </Form.Control>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>

          {touched.password && (
            <>
              <Form.Message match="valueMissing" className="text-sm text-error">
                Password is required
              </Form.Message>

              <Form.Message match="tooShort" className="text-sm text-error">
                Password must be at least 8 characters
              </Form.Message>

              <Form.Message match="patternMismatch" className="text-sm text-error">
                Password must contain at least one uppercase letter, one lowercase letter, one
                number and one special character
              </Form.Message>
            </>
          )}

          {!touched.password && (
            <div className="text-xs text-muted-foreground space-y-1">
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
              className="size-4 shrink-0 cursor-pointer rounded border border-border-strong accent-primary"
            />
          </div>
          <div className="text-sm">
            <label htmlFor="terms" className="text-foreground-secondary">
              I agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-accent transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-accent transition-colors"
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
