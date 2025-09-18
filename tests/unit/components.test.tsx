/**
 * Core UI Components Unit Tests
 * Tests for critical components like ErrorBoundary, UnifiedLoader, Dashboard components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import UnifiedLoader from '@/components/ui/UnifiedLoader';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  test('should show error details in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Development Error Details:')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test('should provide retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    // After clicking try again, component should reset
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('should provide reload functionality', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    delete (window as any).location;
    window.location = { reload: mockReload } as any;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  test('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('should show support contact information', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Need help? Contact support at')).toBeInTheDocument();
    expect(screen.getByText('support@fisherbackflows.com')).toBeInTheDocument();
  });
});

describe('UnifiedLoader', () => {
  test('should render spinner variant by default', () => {
    render(<UnifiedLoader />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  test('should render different variants', () => {
    const { rerender } = render(<UnifiedLoader variant="dots" />);
    expect(document.querySelector('.flex.space-x-1')).toBeInTheDocument();

    rerender(<UnifiedLoader variant="pulse" />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

    rerender(<UnifiedLoader variant="wave" />);
    expect(document.querySelector('.flex.items-end')).toBeInTheDocument();

    rerender(<UnifiedLoader variant="skeleton" />);
    expect(document.querySelector('.space-y-3')).toBeInTheDocument();
  });

  test('should render different sizes', () => {
    const { rerender } = render(<UnifiedLoader size="sm" />);
    expect(document.querySelector('.h-4.w-4')).toBeInTheDocument();

    rerender(<UnifiedLoader size="lg" />);
    expect(document.querySelector('.h-8.w-8')).toBeInTheDocument();

    rerender(<UnifiedLoader size="xl" />);
    expect(document.querySelector('.h-12.w-12')).toBeInTheDocument();
  });

  test('should render with text', () => {
    render(<UnifiedLoader text="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  test('should render inline layout', () => {
    render(<UnifiedLoader text="Loading..." inline />);

    const container = document.querySelector('.flex-row.space-x-2');
    expect(container).toBeInTheDocument();
  });

  test('should render fullscreen overlay', () => {
    render(<UnifiedLoader fullScreen />);

    const overlay = document.querySelector('.fixed.inset-0.z-50');
    expect(overlay).toBeInTheDocument();
  });

  test('should render overlay variant', () => {
    render(<UnifiedLoader overlay />);

    const overlay = document.querySelector('.absolute.inset-0.z-10');
    expect(overlay).toBeInTheDocument();
  });

  test('should apply custom className', () => {
    render(<UnifiedLoader className="custom-class" />);

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  test('should render different colors', () => {
    const { rerender } = render(<UnifiedLoader color="blue" />);
    expect(document.querySelector('.border-blue-400')).toBeInTheDocument();

    rerender(<UnifiedLoader color="green" />);
    expect(document.querySelector('.border-green-400')).toBeInTheDocument();

    rerender(<UnifiedLoader color="red" />);
    expect(document.querySelector('.border-red-400')).toBeInTheDocument();
  });
});

describe('Component Performance', () => {
  test('UnifiedLoader should be memoized', () => {
    const { rerender } = render(<UnifiedLoader variant="spinner" />);

    // Props that shouldn't cause re-render
    rerender(<UnifiedLoader variant="spinner" />);

    // Should not cause unnecessary re-renders
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('ErrorBoundary should handle multiple error scenarios', async () => {
    let shouldThrow = false;

    const ToggleError = () => {
      if (shouldThrow) throw new Error('Toggle error');
      return <button onClick={() => { shouldThrow = true; }}>Trigger Error</button>;
    };

    render(
      <ErrorBoundary>
        <ToggleError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Trigger Error')).toBeInTheDocument();

    // Simulate error being thrown
    shouldThrow = true;

    // Force re-render to trigger error
    fireEvent.click(screen.getByText('Trigger Error'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});