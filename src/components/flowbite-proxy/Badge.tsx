'use client';

import { Badge as FlowbiteBadge, type BadgeProps } from 'flowbite-react';

type CustomBadgeProps = BadgeProps & {
  customColor?: string;
};

const badgeTheme = {
  root: {
    base: 'inline-flex h-fit items-center gap-1 text-sm font-semibold transition-all duration-300',
    color: {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      primary: 'bg-wasabi-100 text-wasabi-800 dark:bg-wasabi-900 dark:text-wasabi-200',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      // Default Flowbite colors for backward compatibility
      info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      failure: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      dark: 'bg-gray-800 text-gray-100 dark:bg-gray-200 dark:text-gray-800',
      filter: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    },
    href: 'group',
    size: {
      xs: 'text-xs font-medium px-2.5 py-0.5',
      sm: 'text-sm font-medium px-2.5 py-0.5',
      lg: 'text-lg font-normal px-2.5 py-0.5',
    },
  },
  icon: {
    off: 'rounded-sm px-2 py-0.5',
    on: 'rounded-full p-1',
    size: {
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
    },
  },
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate relative luminance
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio
const getContrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Get contrasting text color
const getContrastingColor = (backgroundColor: string): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  const bgLuminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const whiteLuminance = getLuminance(255, 255, 255);
  const blackLuminance = getLuminance(0, 0, 0);

  const whiteContrast = getContrastRatio(bgLuminance, whiteLuminance);
  const blackContrast = getContrastRatio(bgLuminance, blackLuminance);

  // WCAG 2.0 requires a contrast ratio of at least 4.5:1 for normal text
  return whiteContrast > blackContrast && whiteContrast >= 4.5 ? '#FFFFFF' : '#000000';
};

export const Badge = ({ customColor, className = '', ...props }: CustomBadgeProps) => {
  // If custom hex color is provided, use inline styles
  if (customColor && customColor.startsWith('#')) {
    return (
      <span
        className={`flex h-fit items-center gap-1 font-semibold px-2 py-0.5 text-xs font-medium rounded ${className}`}
        style={{
          backgroundColor: customColor,
          color: getContrastingColor(customColor),
        }}
        {...props}
      />
    );
  }

  // Otherwise, use Flowbite's default Badge
  return <FlowbiteBadge theme={badgeTheme} className={className} {...props} />;
};
