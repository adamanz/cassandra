import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that can wrap components with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add any providers here that your app uses (like Redux, Theme, etc.)
  return render(ui, { ...options });
}

// Mock console methods
export const mockConsole = () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  return {
    getLogCalls: () => (console.log as jest.Mock).mock.calls,
    getErrorCalls: () => (console.error as jest.Mock).mock.calls,
    getWarnCalls: () => (console.warn as jest.Mock).mock.calls,
  };
};

// Mock Date for consistent testing
export const mockDate = (dateString: string) => {
  const RealDate = Date;
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(dateString));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  return { RealDate };
};

// Helper to wait for async operations
export const waitForAsync = async (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper to create mock functions with TypeScript types
export function createMockFunction<T extends (...args: any[]) => any>(): jest.MockedFunction<T> {
  return jest.fn() as jest.MockedFunction<T>;
}