'use client';

import { Spinner as FlowbiteSpinner, SpinnerProps } from 'flowbite-react';

const spinnerTheme = {
  base: 'inline animate-spin text-silicongray-200',
  color: {
    gray: 'fill-silicongray-600',
    info: 'fill-wasabi-600',
    failure: 'fill-red-600',
    success: 'fill-wasabi-500',
    warning: 'fill-yellow-400',
  },
  light: {
    off: {
      base: 'dark:text-silicongray-600',
      color: {
        failure: '',
        gray: 'dark:fill-silicongray-300',
        info: '',
        pink: '',
        purple: '',
        success: '',
        warning: '',
      },
    },
  },
  size: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  },
};

function Spinner({ children, ...props }: SpinnerProps) {
  return (
    <FlowbiteSpinner theme={spinnerTheme} {...props}>
      {children}
    </FlowbiteSpinner>
  );
}

export { Spinner };
