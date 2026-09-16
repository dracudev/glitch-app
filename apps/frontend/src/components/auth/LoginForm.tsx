import { useState } from 'react';
import * as Form from '@radix-ui/react-form';
import type { LoginRequest } from '@glitch/shared-types';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  redirectTo?: string;
  className?: string;
}

export default function LoginForm({ redirectTo = '/feed', className = '' }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Mark all fields as touched on submit
    setTouched({ email: true, password: true });

    clearError();

    const formData = new FormData(event.currentTarget);
    const data: LoginRequest = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      await login(data);
      window.location.href = redirectTo;
    } catch (error) {
      console.error('Login failed:', error);
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
                <h3 className="text-sm font-medium text-error">Login error</h3>
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

        {/* Password field */}
        <Form.Field name="password" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-foreground">
            Password
          </Form.Label>

          <div className="relative">
            <Form.Control asChild>
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                onBlur={() => handleBlur('password')}
                className="pr-11"
                placeholder="Enter your password"
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
            <Form.Message match="valueMissing" className="text-sm text-error">
              Password is required
            </Form.Message>
          )}
        </Form.Field>

        {/* Remember me and Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="size-4 shrink-0 cursor-pointer rounded border border-border-strong accent-primary"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-foreground-secondary"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="/auth/forgot-password"
              className="font-medium transition-colors text-primary hover:text-accent"
            >
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Submit button */}
        <Form.Submit asChild>
          <Button type="submit" isLoading={isLoading} fullWidth variant={'primary'}>
            Log in
          </Button>
        </Form.Submit>
      </Form.Root>
    </Card>
  );
}
