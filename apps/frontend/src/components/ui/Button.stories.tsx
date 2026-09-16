/**
 * Button Component Examples
 *
 * This file demonstrates all the different ways to use the Button component.
 * Use these patterns in your components for consistency.
 */

import { Button } from './Button';
import { Plus, Settings, Trash2, ExternalLink, Download } from 'lucide-react';

export default function ButtonExamples() {
  return (
    <div className="p-8 space-y-12 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground">Button Component Examples</h1>

      {/* Variants */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="link">Link Button</Button>
        </div>
      </section>

      {/* Sizes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Sizes</h2>
        <div className="flex flex-wrap items-end gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium (Default)</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Icon Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Icon Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button size="icon" variant="primary">
            <Settings />
          </Button>
          <Button size="icon" variant="secondary">
            <Plus />
          </Button>
          <Button size="icon" variant="outline">
            <Trash2 />
          </Button>
          <Button size="icon" variant="ghost">
            <Download />
          </Button>
        </div>
      </section>

      {/* Buttons with Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<Plus />}>Add Item</Button>
          <Button variant="secondary" rightIcon={<ExternalLink />}>
            Open External
          </Button>
          <Button variant="outline" leftIcon={<Download />}>
            Download
          </Button>
          <Button variant="destructive" leftIcon={<Trash2 />}>
            Delete
          </Button>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Loading States</h2>
        <div className="flex flex-wrap gap-4">
          <Button isLoading>Loading...</Button>
          <Button variant="secondary" isLoading>
            Processing
          </Button>
          <Button variant="outline" isLoading>
            Submitting
          </Button>
        </div>
      </section>

      {/* Disabled States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Disabled States</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled Primary</Button>
          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
        </div>
      </section>

      {/* Full Width */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Full Width</h2>
        <div className="max-w-md space-y-3">
          <Button fullWidth>Full Width Primary</Button>
          <Button fullWidth variant="secondary">
            Full Width Secondary
          </Button>
          <Button fullWidth variant="outline" leftIcon={<Plus />}>
            Full Width with Icon
          </Button>
        </div>
      </section>

      {/* As Link (using asChild with Radix Slot) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">As Link (asChild)</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild variant="primary">
            <a href="/profile">Go to Profile</a>
          </Button>
          <Button asChild variant="outline" rightIcon={<ExternalLink />}>
            <a href="https://example.com" target="_blank" rel="noopener noreferrer">
              External Link
            </a>
          </Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Real-world Examples</h2>

        {/* Form Actions */}
        <div className="max-w-md p-6 bg-secondary rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Form Actions</h3>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>

        {/* Card Actions */}
        <div className="max-w-md p-6 bg-secondary rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Card Actions</h3>
          <p className="text-foreground-secondary text-sm">This is a card with multiple action buttons</p>
          <div className="flex gap-2">
            <Button size="sm" leftIcon={<Plus />}>
              Add
            </Button>
            <Button size="sm" variant="ghost">
              <Settings />
            </Button>
            <Button size="sm" variant="ghost">
              <Trash2 />
            </Button>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="max-w-md p-6 bg-secondary rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Dialog Actions</h3>
          <p className="text-foreground-secondary text-sm">Are you sure you want to delete this item?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive" leftIcon={<Trash2 />}>
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Code Examples</h2>
        <div className="bg-secondary p-6 rounded-lg space-y-4 font-mono text-sm">
          <div>
            <p className="text-muted-foreground mb-2">// Basic usage</p>
            <code className="text-accent">{'<Button>Click me</Button>'}</code>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">// With variants and sizes</p>
            <code className="text-accent">
              {'<Button variant="outline" size="lg">Large Outline</Button>'}
            </code>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">// With icons</p>
            <code className="text-accent">
              {'<Button leftIcon={<Plus />}>Add Item</Button>'}
            </code>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">// Loading state</p>
            <code className="text-accent">{'<Button isLoading>Submitting...</Button>'}</code>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">// As a link (Radix Slot)</p>
            <code className="text-accent">
              {'<Button asChild><a href="/profile">Profile</a></Button>'}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
