'use client';

import { forwardRef } from 'react';
import { Button as FlowbiteButton, type ButtonProps as FlowbiteButtonProps } from 'flowbite-react';
import { Spinner } from './Spinner';
import type { SpinnerProps } from 'flowbite-react';

// Define the custom theme for Button
const buttonTheme = {
  base: '!rounded group relative flex flex-row h-min items-center justify-center px-1 py-2px text-center font-medium focus:z-10 ring-wasabi-500 transition-colors duration-300',

  color: {
    // ── Pulse design-system variants ──────────────────────────────────────
    // Primary  #D90429 → gradient to tertiary #FF4D6D
    'pulse-primary':
      'border border-transparent bg-gradient-to-br from-[#D90429] to-[#FF4D6D] text-white ' +
      'focus:ring-4 focus:ring-[#D90429]/30 enabled:hover:opacity-90',
    // Secondary  solid #EF233C
    'pulse-secondary':
      'border border-transparent bg-[#EF233C] text-white ' +
      'focus:ring-4 focus:ring-[#EF233C]/30 enabled:hover:bg-[#D90429]',
    // Tertiary  soft tinted surface
    'pulse-tertiary':
      'border border-[#fee2e2] bg-[#fef2f2] text-[#D90429] ' +
      'focus:ring-4 focus:ring-[#D90429]/20 enabled:hover:bg-[#fee2e2]',
    // Neutral  #2B2D42 dark navy
    'pulse-neutral':
      'border border-transparent bg-[#2B2D42] text-white ' +
      'focus:ring-4 focus:ring-[#2B2D42]/30 enabled:hover:bg-[#1e2030]',

    // ── Legacy silicon-dashboard variants (kept for existing usage) ────────
    cyan:
      'border border-transparent bg-cyan-500 text-white focus:ring-4 focus:ring-cyan-300 ' +
      'enabled:hover:bg-cyan-600 dark:border-cyan-600 dark:bg-cyan-600 dark:text-white dark:focus:ring-cyan-700 ' +
      'dark:enabled:hover:border-cyan-700 dark:enabled:hover:bg-cyan-700',
    wasabi: `text-wasabi-600 bg-wasabi-50 hover:bg-wasabi-400 border border-wasabi-300
      dark:text-wasabi-300 dark:bg-wasabi-900 dark:hover:bg-wasabi-800 dark:border-wasabi-600`,
    primary:
      'text-white bg-black hover:bg-silicongray-700 hover:text-silicongray-50 dark:bg-white dark:text-text-inverse dark:hover:bg-silicongray-200',
    primarygray:
      'text-black bg-silicongray-50 bg-silicongray-100 hover:bg-silicongray-200 dark:bg-silicongray-900 dark:text-white dark:hover:bg-silicongray-700',

    secondary:
      'bg-transparent text-text-primary border border-silicongray-700 hover:bg-card-bg-secondary hover:border-silicongray-500 dark:text-silicongray-200 dark:border-silicongray-700 dark:hover:bg-silicongray-800 dark:hover:border-silicongray-500',    alt: `text-silicongray-700 bg-silicongray-100 border border-silicongray-300 hover:bg-silicongray-200
      dark:text-white dark:bg-silicongray-800 dark:border-silicongray-600 dark:hover:bg-silicongray-700`,
    altghost: `text-silicongray-700 border border-silicongray-200 hover:bg-silicongray-100
      dark:text-silicongray-200  dark:border-silicongray-700 dark:hover:bg-silicongray-800`,
    gray: 'bg-white text-text-inverse focus:text-wasabi-700 enabled:hover:bg-silicongray-100 enabled:hover:text-silicongray-700 dark:border-silicongray-700 dark:bg-transparent dark:text-silicongray-400 dark:enabled:hover:bg-silicongray-800 dark:enabled:hover:text-white',
    white: `bg-black text-silicongray-50 focus:text-wasabi-200 enabled:hover:bg-silicongray-800 enabled:hover:text-white border border-black
      dark:bg-white dark:text-text-inverse dark:focus:text-wasabi-700 dark:enabled:hover:bg-silicongray-100 dark:enabled:hover:text-silicongray-700 dark:border-white`,
    transparent: 'bg-transparent text-white border border-silicongray-400 hover:bg-silicongray-800',
    successghost: 'bg-[#0e2721] text-[#31c48d] border border-[#31c48d] hover:bg-[#0e2721]/80',
    newgray: `border border-silicongray-700 bg-silicongray-700 text-silicongray-100 hover:bg-silicongray-500 hover:text-white hover:border-silicongray-500`,
    gradient:
      'si-shimmer font-geist-mono !font-medium uppercase tracking-widest bg-gradient-to-b from-[#FAFBFF] to-[#C8CBD8] text-silicongray-900 border border-silicongray-300/50 hover:brightness-110 hover:scale-[1.02] hover:border-white/60 transition-all duration-200',
  },
};

interface CustomButtonProps extends FlowbiteButtonProps {
  /**
   * Props forwarded to the custom <Spinner /> rendered while `isProcessing` is true.
   * You can change colour, size … using the same API as the standalone Spinner component.
   */
  spinnerProps?: Partial<SpinnerProps>;
}

interface ButtonComponent
  extends React.ForwardRefExoticComponent<CustomButtonProps & React.RefAttributes<HTMLButtonElement>> {
  Group: typeof FlowbiteButton.Group;
}

const Button = forwardRef<HTMLButtonElement, CustomButtonProps>((props, ref) => {
  const { children, spinnerProps, ...rest } = props;

  return (
    <FlowbiteButton
      theme={buttonTheme}
      ref={ref}
      // Supply our own spinner whenever the caller toggles `isProcessing`
      processingSpinner={<Spinner {...spinnerProps} />}
      {...rest}
    >
      {children}
    </FlowbiteButton>
  );
}) as ButtonComponent;

Button.displayName = 'Button';
Button.Group = FlowbiteButton.Group;

export { Button };
