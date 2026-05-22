/// <reference types="jest" />
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      {children}
    </SafeAreaProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react-native';
export { customRender as render };
