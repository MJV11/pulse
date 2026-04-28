'use client';

// src/components/TextInput.tsx

import React, { useMemo, useState } from 'react';
import { TextInput as FlowbiteTextInput, type TextInputProps } from 'flowbite-react';
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi'; // Import PiEye icons
import { IconContext } from 'react-icons';
import { twMerge } from 'tailwind-merge';

/** Flowbite default merged into `field.input` before color/size tokens (see TextInput.mjs). */
const FLOWBITE_INPUT_BASE =
  'block w-full border disabled:cursor-not-allowed disabled:opacity-50';

/** Hide browser steppers on `<input type="number">` (Chrome / Safari / Firefox). */
const NUMBER_INPUT_NO_SPIN =
  '[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

type Sizing = 'sm' | 'md' | 'lg' | 'xl';

interface CustomTextInputProps extends Omit<TextInputProps, 'prefix' | 'sizing'> {
  // Optional right-side suffix (e.g., %, months)
  suffix?: React.ReactNode;
  // Optional left-side prefix (e.g., $)
  prefix?: React.ReactNode;
  /**
   * Field size token. Drives input height, padding, and text size in lockstep
   * — and the affordance offsets (suffix gutter, password eye button) so the
   * input scales as a unit. Defaults to `md` (≈42px tall) to match the
   * historical Pulse design.
   */
  sizing?: Sizing;
  /**
   * Classes for the native `<input>`. Flowbite only puts `className` on its outer wrapper, not the
   * input, so typography utilities on `className` often do not affect the field — use this instead.
   */
  inputClassName?: string;
}

/**
 * Per-size spec for the input. Keeps the typography / padding / height in
 * lockstep with the absolutely-positioned suffix gutter and password eye
 * button so all four sizes look balanced.
 *
 * `input`        → tailwind classes applied to the native <input> (height,
 *                  padding, text size).
 * `affordancePx` → reserved padding inside the input that the absolutely-
 *                  positioned suffix / eye button sits on top of.
 * `eyeMaxPx`     → max-height for the password-toggle button.
 * `iconClass`    → tailwind size class for the password eye icon.
 */
const SIZE_SPECS: Record<Sizing, {
  input: string;
  affordancePx: number;
  eyeMaxPx: number;
  iconClass: string;
}> = {
  sm: { input: 'h-9 px-3 py-1 text-xs',         affordancePx: 30, eyeMaxPx: 36, iconClass: 'w-4 h-4' },
  md: { input: 'h-[38px] px-3.5 py-1.5 text-sm',    affordancePx: 36, eyeMaxPx: 42, iconClass: 'w-5 h-5' },
  lg: { input: 'h-12 px-4 py-2 text-base',        affordancePx: 40, eyeMaxPx: 48, iconClass: 'w-5 h-5' },
  xl: { input: 'h-14 px-5 py-2.5 text-lg',        affordancePx: 48, eyeMaxPx: 56, iconClass: 'w-6 h-6' },
};

// Define the custom theme for TextInput
const textInputTheme = {
  addon:
    'inline-flex items-center border border-r-0 border-gray-300 bg-gray-200 px-3 text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400',
  field: {
    base: 'relative w-full',
    icon: {
      base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
      svg: 'h-5 w-5 text-gray-700 dark:text-gray-300',
    },
    rightIcon: {
      base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
      svg: 'h-5 w-5 text-gray-700 dark:text-gray-500',
    },
    input: {
      /**
       * Flowbite default `withAddon.off` is `rounded-lg`. Use empty string so we do not add radius here;
       * `ghost` uses `!rounded-[0px]`, `gray` / `altghost` use `!rounded-lg` for bordered fields.
       */
      withAddon: {
        on: 'rounded-r-lg',
        off: '',
      },
      /**
       * Heights / paddings / text sizes live exclusively here so the `sizing`
       * prop is the single source of truth. Colors below intentionally do not
       * set their own height — see `SIZE_SPECS` for the matching gutters.
       */
      sizes: {
        sm: SIZE_SPECS.sm.input,
        md: SIZE_SPECS.md.input,
        lg: SIZE_SPECS.lg.input,
        xl: SIZE_SPECS.xl.input,
      },
      colors: {
        // Pulse design-system input style
        pulse:
          '!rounded-lg border-gray-300 bg-white text-gray-900 ' +
          'focus:border-[#D90429] focus:ring-[#D90429]/20 ' +
          'placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white',
        'pulse-primary':
          '!rounded-lg border-[#fecaca] bg-white text-[#1d1a20] ' +
          'focus:border-[#D90429] focus:ring-[#dc2626]/20 ' +
          'placeholder:text-[#94a3b8] dark:border-gray-600 dark:bg-gray-800 dark:text-white',
        ghost: '!rounded-[0px] text-right !p-0 bg-transparent border-none text-gray-600 focus:border-none focus:ring-0 focus:outline-none dark:border-none dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-none dark:focus:ring-0',
        gray: '!rounded border-gray-300 bg-gray-50 text-gray-900 focus:border-wasabi-600 focus:ring-wasabi-600 dark:border-input-stroke bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-wasabi-500 dark:focus:ring-wasabi-500',
        altghost:
          '!rounded bg-transparent border-gray-300 text-gray-900 focus:border-wasabi-600 focus:ring-wasabi-600 dark:border-input-stroke dark:text-white dark:placeholder-gray-400 dark:focus:border-wasabi-500 dark:focus:ring-wasabi-500',
      },
    },
  },
};

const TextInput = React.forwardRef<HTMLInputElement, CustomTextInputProps>(
  ({ type, className, suffix, prefix, inputClassName, sizing = 'md', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const spec = SIZE_SPECS[sizing];

    const theme = useMemo(() => {
      const noSpin = type === 'number' ? NUMBER_INPUT_NO_SPIN : '';
      if (!inputClassName && !noSpin) return textInputTheme;
      return {
        ...textInputTheme,
        field: {
          ...textInputTheme.field,
          input: {
            ...textInputTheme.field.input,
            base: twMerge(FLOWBITE_INPUT_BASE, inputClassName, noSpin),
          },
        },
      };
    }, [inputClassName, type]);

    // Determine the input type based on showPassword state
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    // Toggle password visibility
    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const calcPaddingRight = () => {
      if (type === 'password') return `${spec.affordancePx}px`;
      if (suffix) return `${spec.affordancePx}px`;
      return '';
    };
    const calcPaddingLeft = () => {
      if (prefix) return `${Math.round(spec.affordancePx * 0.78)}px`;
      return '';
    };

    return (
      <div className={twMerge('relative w-full min-w-0', className)}>
        <FlowbiteTextInput
          style={{ paddingRight: calcPaddingRight(), paddingLeft: calcPaddingLeft() }}
          type={inputType}
          theme={theme}
          sizing={sizing}
          ref={ref}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-1 flex items-center px-1 text-gray-600 focus:outline-none"
            style={{ maxHeight: `${spec.eyeMaxPx}px` }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <IconContext.Provider
              value={{
                className:
                  (props?.color === 'failure'
                    ? 'text-gray-900'
                    : props?.color === 'ghost'
                      ? 'text-white'
                      : 'text-gray-500') +
                  ' ' +
                  spec.iconClass,
              }}
            >
              {showPassword ? <PiEyeSlash /> : <PiEyeLight />}
            </IconContext.Provider>
          </button>
        )}

        {suffix && type !== 'password' && (
          <span
            className="absolute inset-y-0 right-2 flex items-center text-xs text-gray-700 dark:text-gray-300 pointer-events-none"
            aria-hidden
          >
            {suffix}
          </span>
        )}

        {prefix && (
          <span
            className="absolute inset-y-0 left-2 flex items-center text-xs text-gray-700 dark:text-gray-300 pointer-events-none"
            aria-hidden
          >
            {prefix}
          </span>
        )}
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';

export { TextInput };
