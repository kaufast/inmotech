import * as Sentry from '@sentry/nextjs';
import React from 'react';

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactElement | ((errorData: {
    error: unknown;
    componentStack: string;
    eventId: string;
    resetError(): void;
  }) => React.ReactElement)
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || (({ error, resetError }) => (
      <div className="p-4 text-red-600 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        <button 
          onClick={resetError}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    )),
  });
}

export default withErrorBoundary; 