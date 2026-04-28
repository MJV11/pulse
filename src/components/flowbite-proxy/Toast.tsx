'use client';

import React from 'react';
import { Toast as FlowbiteToast, ToastProps, CustomFlowbiteTheme } from 'flowbite-react';
import clsx from 'clsx';

// -----------------------------------------------------------------------------
// Default theme ----------------------------------------------------------------
// -----------------------------------------------------------------------------

const baseTheme: Partial<CustomFlowbiteTheme['toast']> = {
  root: {
    base: `flex items-center gap-4 px-4 py-2 w-full rounded-lg border bg-white text-gray-800 dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-700 
        shadow-md hover:brightness-110 hover:-translate-y-1`,
    closed: '',
  },
  toggle: {
    base: 'text-sm font-normal',
    icon: '',
  },
};

// -----------------------------------------------------------------------------
// Props & helpers --------------------------------------------------------------
// -----------------------------------------------------------------------------

type ToastColor = 'default' | 'success' | 'failure' | 'info' | 'warning';

// Color class map -------------------------------------------------------------
const colorClasses: Record<ToastColor, string> = {
  default:
    'bg-white text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700',
  success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  failure: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  warning:
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
};

// Toggle colour classes -------------------------------------------------------
const toggleColorClasses: Record<ToastColor, string> = {
  default: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
  success: 'text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100',
  failure: 'text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-100',
  info: 'text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100',
  warning: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-300 dark:hover:text-yellow-100',
};

type CustomToastProps = ToastProps & {
  /**
   * Provide partial overrides for the Flowbite theme.  They will be shallow-merged
   * with the Silicon defaults.
   */
  theme?: Partial<CustomFlowbiteTheme['toast']>;
  /** Color variant for the toast (e.g. "success") */
  color?: ToastColor;
};

// Utility: shallow-merge the top-level keys of the theme
const mergeTheme = (
  base: Partial<CustomFlowbiteTheme['toast']>,
  override: Partial<CustomFlowbiteTheme['toast']> | undefined,
): Partial<CustomFlowbiteTheme['toast']> => ({
  ...base,
  ...override,
});

// -----------------------------------------------------------------------------
// Component -------------------------------------------------------------------
// -----------------------------------------------------------------------------

interface ToastStatic extends React.FC<CustomToastProps> {
  Toggle: typeof FlowbiteToast.Toggle;
}

const ToastImpl: React.FC<CustomToastProps> = ({ theme, className, children, color = 'default', ...props }) => {
  const mergedTheme: any = mergeTheme(baseTheme, theme) || {};
  // Inject colour classes for the close toggle
  mergedTheme.toggle = {
    ...mergedTheme.toggle,
    base: clsx(mergedTheme.toggle?.base ?? '', toggleColorClasses[color]),
  };
  const classes = clsx(mergedTheme.root?.base ?? '', colorClasses[color], className);

  return (
    <FlowbiteToast theme={mergedTheme} className={classes} {...props}>
      {children}
    </FlowbiteToast>
  );
};

export const Toast = Object.assign(ToastImpl, { Toggle: FlowbiteToast.Toggle }) as ToastStatic;
