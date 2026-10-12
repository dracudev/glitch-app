import { useState } from 'react';
import * as Form from '@radix-ui/react-form';
import { forgotPassword } from '@/services/auth';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get('email') as string) || '';

    try {
      await forgotPassword({ email });
      setSentTo(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sentTo) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="space-y-6 text-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
            <p className="mt-2 text-sm text-foreground-secondary">
              If an account exists for <span className="text-foreground">{sentTo}</span>, we have
              sent a link to reset your password.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Did not get it? Check your spam folder, or try again with a different address.
          </p>

          <div className="flex flex-col gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => setSentTo(null)}>
              Try another email
            </Button>
            <a
              href="/auth/login"
              className="text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              Back to log in
            </a>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <Form.Root onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div role="alert" className="rounded-md border border-error/20 bg-error/10 p-4">
            <h3 className="text-sm font-medium text-error">Could not send the link</h3>
            <p className="mt-1 text-sm text-error/80">{error}</p>
          </div>
        )}

        <Form.Field name="email" className="space-y-2">
          <Form.Label className="block text-sm font-medium text-foreground">
            Email address
          </Form.Label>

          <Form.Control asChild>
            <Input type="email" autoComplete="email" required placeholder="Enter your email" />
          </Form.Control>

          <Form.Message match="valueMissing" className="text-sm text-error">
            Email is required
          </Form.Message>

          <Form.Message match="typeMismatch" className="text-sm text-error">
            Please provide a valid email address
          </Form.Message>
        </Form.Field>

        <Form.Submit asChild>
          <Button type="submit" isLoading={isLoading} fullWidth variant="primary">
            Send reset link
          </Button>
        </Form.Submit>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <a
            href="/auth/login"
            className="font-medium text-primary transition-colors hover:text-accent"
          >
            Back to log in
          </a>
        </p>
      </Form.Root>
    </Card>
  );
}
