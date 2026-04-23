'use client';

import React from 'react';
import { Textarea as FlowbiteTextarea, TextareaProps } from 'flowbite-react';

const textareaTheme = {
  base: 'block w-full min-h-[100px] rounded-lg border disabled:cursor-not-allowed disabled:opacity-50',
  colors: {
    gray: 'bg-white border-silicongray-200 text-silicongray-900 focus:border-silicongray-500 focus:ring-silicongray-500 dark:border-silicongray-700 dark:bg-silicongray-800 dark:text-white dark:placeholder-silicongray-400 dark:focus:border-silicongray-500 dark:focus:ring-silicongray-500',
    info: 'border-cyan-500 bg-cyan-50 text-cyan-900 placeholder-cyan-700 focus:border-cyan-500 focus:ring-cyan-500 dark:border-cyan-400 dark:bg-cyan-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
    failure:
      'border-red-500 bg-red-50 text-red-900 placeholder-red-700 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:bg-red-100 dark:focus:border-red-500 dark:focus:ring-red-500',
    warning:
      'border-yellow-500 bg-yellow-50 text-yellow-900 placeholder-yellow-700 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-400 dark:bg-yellow-100 dark:focus:border-yellow-500 dark:focus:ring-yellow-500',
    success:
      'border-green-500 bg-green-50 text-green-900 placeholder-green-700 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:bg-green-100 dark:focus:border-green-500 dark:focus:ring-green-500',
  },
  withShadow: {
    on: ' dark:-light',
    off: '',
  },
};

const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ children, ...props }, ref) => {
  return (
    <FlowbiteTextarea ref={ref} theme={textareaTheme} {...props}>
      {children}
    </FlowbiteTextarea>
  );
});

TextArea.displayName = 'TextArea';

export { TextArea };
