'use client';

// Checkbox.tsx
import { Checkbox as FlowbiteCheckbox, CheckboxProps, CustomFlowbiteTheme } from 'flowbite-react';
import clsx from 'clsx';

const baseTheme: Partial<CustomFlowbiteTheme['checkbox']> = {
  root: {
    base: 'rounded border focus:ring-0', // generic shape
    color: {
      default: 'text-silicongray-600 border-silicongray-500',
      wasabi:
        'text-wasabi-500 border-silicongray-400 dark:border-silicongray-600 selected:border-wasabi-500 bg-silicongray-300 dark:bg-silicongray-700',
    },
  },
};

type ColorOpt = 'default' | 'wasabi';

interface CustomCheckboxProps extends CheckboxProps {
  color?: ColorOpt;
  theme?: Partial<CustomFlowbiteTheme['checkbox']>;
}

// shallow merge helper
const merge = (def: Partial<CustomFlowbiteTheme['checkbox']>, override?: Partial<CustomFlowbiteTheme['checkbox']>) => ({
  ...def,
  ...override,
});

export const Checkbox: React.FC<CustomCheckboxProps> = ({ color = 'default', theme, className, ...props }) => {
  const mergedTheme = merge(baseTheme, theme);

  const classes = clsx(mergedTheme.root?.base, mergedTheme.root?.color?.[color], className);

  // Don't pass theme to avoid conflicts, rely on className for styling
  return <FlowbiteCheckbox className={classes} {...props} />;
};
