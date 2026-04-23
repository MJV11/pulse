'use client';

import { Alert as FlowbiteAlert, type AlertProps, type CustomFlowbiteTheme } from 'flowbite-react';

// Define custom theme for Alert
const customTheme: CustomFlowbiteTheme['alert'] = {
  base: 'flex flex-col gap-2 p-4 text-sm text-left border justify-center w-full transition-all duration-300',
  borderAccent: 'border-t-4',
  closeButton: {
    base: 'ml-auto -my-1.5 inline-flex shrink-0 rounded focus:ring-2 p-1',
    icon: 'w-5 h-5',
    color: {
      info: 'bg-blue-100 text-blue-500 hover:bg-blue-200 focus:ring-blue-400 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-300 dark:border-blue-700',
      gray: 'bg-silicongray-100 text-silicongray-500 hover:bg-silicongray-200 focus:ring-silicongray-400 dark:bg-silicongray-900 dark:text-silicongray-400 dark:hover:bg-silicongray-300 dark:border-silicongray-700',
      failure:
        'bg-red-100 text-red-500 hover:bg-red-200 focus:ring-red-400 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-300 dark:border-red-700',
      success:
        'bg-green-100 text-green-500 hover:bg-green-200 focus:ring-green-400 dark:bg-green-900 dark:text-green-400 dark:hover:bg-green-300 dark:border-green-700',
      warning:
        'bg-yellow-100 text-yellow-500 hover:bg-yellow-200 focus:ring-yellow-400 dark:bg-[#351F20] dark:text-yellow-400 dark:hover:bg-yellow-300 dark:border-yellow-700',
    },
  },
  color: {
    info: 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-400 dark:border-blue-700',
    gray: 'bg-silicongray-50 text-silicongray-900 dark:bg-silicongray-900 dark:text-silicongray-400 dark:border-silicongray-700',
    failure: 'bg-red-200 text-red-900 dark:bg-[#771D1E] dark:text-[#f98080] dark:border-[#771D1E]',
    success: 'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-400 dark:border-green-700',
    warning: 'bg-orange-200 text-yellow-900 dark:bg-[#351F20] dark:text-orange-300 dark:border-[#351F20]',
    default:
      'bg-white text-silicongray-900 dark:bg-silicongray-800 dark:text-silicongray-200 dark:border-silicongray-700',
  },
  icon: 'mr-2 inline h-5 w-5 flex-shrink-0',
  rounded: 'rounded',
  wrapper: 'flex flex-row items-center w-full h-auto [&>div]:w-full',
};

function Alert({ children, ...props }: AlertProps) {
  return (
    <FlowbiteAlert theme={customTheme} {...props}>
      {children}
    </FlowbiteAlert>
  );
}

export { Alert };
