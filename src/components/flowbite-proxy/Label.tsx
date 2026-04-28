'use client';

import { Label as FlowbiteLabel, LabelProps } from 'flowbite-react';

const labelTheme = {
  root: {
    base: 'text-sm font-normal',
    colors: {
      default: 'text-gray-900 dark:text-gray-300',
      white: 'text-black dark:text-white',
      pulse: 'text-gray-700 dark:text-gray-300',
    },
  },
};

function Label({ children, ...props }: LabelProps) {
  return (
    <FlowbiteLabel theme={labelTheme} {...props}>
      {children}
    </FlowbiteLabel>
  );
}

export { Label };
