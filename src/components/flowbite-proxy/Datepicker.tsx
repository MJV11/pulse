'use client';

import { Datepicker as FlowbiteDatepicker, DatepickerProps, CustomFlowbiteTheme } from 'flowbite-react';
import React from 'react';

// -----------------------------------------------------------------------------
// Default (brand-coloured) theme ------------------------------------------------
// -----------------------------------------------------------------------------
// Flowbiteʼs date-picker exposes a very deep theme object.  We override only the
// parts we care about (popup colours + trigger input) and let callers supply
// further overrides via the `theme` prop.

const defaultTheme: Partial<CustomFlowbiteTheme['datepicker']> = {
  root: {
    base: 'relative',
    input: {
      base: '',
      field: {
        base: '',
        input: {
          base: 'text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700',
          sizes: {
            sm: '',
            md: 'w-full',
            lg: '',
          },
          colors: {
            gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
          },
        },
      },
    },
  },
  popup: {
    root: {
      base: 'mt-2 absolute bg-gray-100 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50',
      inner: '',
    },
    header: {
      selectors: {
        base: `flex items-center justify-between gap-3 text-gray-700 dark:text-gray-200`,
        button: {
          base: 'hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full p-1',
          prev: 'rounded py-2 px-2',
          next: 'rounded py-2 px-2',
          view: 'rounded py-1 px-2',
        },
      },
    },
    view: {
      base: 'text-gray-700 dark:text-gray-200',
    },
    footer: {
      button: {
        today:
          'justify-center gap-3 text-gray-900 dark:text-white hover:text-gray-800 hover:dark:text-gray-200 bg-wasabi-600 hover:bg-wasabi-700',
      },
    },
  },
  views: {
    days: {
      header: {
        //base: '',
        title: 'font-[500] text-center text-gray-600 dark:text-gray-300',
      },
      items: {
        item: {
          base: 'text-center text-md rounded p-0.5 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900',
          selected: 'bg-wasabi-600 text-white hover:bg-wasabi-700 dark:hover:bg-wasabi-700',
        },
      },
    },
  },
};

// -----------------------------------------------------------------------------
// Proxy component --------------------------------------------------------------
// -----------------------------------------------------------------------------

interface CustomDatepickerProps extends DatepickerProps {
  /**
   * Provide partial overrides for the Flowbite theme.  They will be shallow-merged
   * with the Silicon defaults.
   */
  theme?: Partial<CustomFlowbiteTheme['datepicker']>;
  /**
   * Upstream types for Flowbite's Datepicker can lag; expose this commonly used
   * callback explicitly to avoid type errors in callers.
   */
  onSelectedDateChanged?: (date: Date) => void;
}

// Utility: shallow-merge the top-level keys of the theme
const mergeTheme = (
  base: Partial<CustomFlowbiteTheme['datepicker']>,
  override: Partial<CustomFlowbiteTheme['datepicker']> | undefined,
): Partial<CustomFlowbiteTheme['datepicker']> => ({
  ...base,
  ...override,
});

export const Datepicker: React.FC<CustomDatepickerProps> = ({ theme, ...props }) => {
  const FlowbiteDp: any = FlowbiteDatepicker; // suppress missing props until upstream types are updated
  return <FlowbiteDp theme={mergeTheme(defaultTheme, theme)} {...props} />;
};
