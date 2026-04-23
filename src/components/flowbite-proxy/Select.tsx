'use client';

import { Select as FlowbiteSelect, SelectProps } from 'flowbite-react';
import { CSSProperties } from 'react';

// Define the custom theme for Select
const selectTheme = {
  field: {
    select: {
      colors: {
        gray: 'h-10 border-silicongray-300 bg-silicongray-50 text-silicongray-900 focus:border-wasabi-500 focus:ring-wasabi-500 dark:border-input-stroke dark:bg-silicongray-800 dark:text-white dark:placeholder-silicongray-400 dark:focus:border-wasabi-500 dark:focus:ring-wasabi-500 !rounded',
        maluable:
          'h-[38px] border-silicongray-300 bg-silicongray-0 focus:border-wasabi-500 focus:ring-wasabi-500 dark:border-input-stroke dark:bg-silicongray-900 dark:focus:border-wasabi-500 dark:focus:ring-wasabi-500 !rounded',
      },
    },
  },
};

// Custom styles to override the select arrow color
const selectStyles: CSSProperties = {
  // Uses a custom background image with silicongray-300 color (#A7A7A7)
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23A7A7A7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'right 0.5rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.5em 1.5em',
  // Prevents default arrow from showing
  appearance: 'none',
};

function Select({ children, ...props }: SelectProps) {
  return (
    <FlowbiteSelect theme={selectTheme} style={selectStyles} {...props}>
      {children}
    </FlowbiteSelect>
  );
}

export { Select };
