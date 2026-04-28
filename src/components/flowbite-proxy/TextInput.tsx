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

interface CustomTextInputProps extends Omit<TextInputProps, 'prefix'> {
  // Optional right-side suffix (e.g., %, months)
  suffix?: React.ReactNode;
  // Optional left-side prefix (e.g., $)
  prefix?: React.ReactNode;
  /**
   * Classes for the native `<input>`. Flowbite only puts `className` on its outer wrapper, not the
   * input, so typography utilities on `className` often do not affect the field — use this instead.
   */
  inputClassName?: string;
}

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
      /** Flowbite defaults add `text-sm` / `sm:text-xs` on sizes; keep padding only. */
      sizes: {
        sm: '',
        md: '',
        lg: '',
      },
      colors: {
        // Pulse design-system input style
        pulse:
          '!rounded-lg h-[42px] border-gray-300 bg-white text-gray-900 ' +
          'focus:border-[#D90429] focus:ring-[#D90429]/20 ' +
          'placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white',
        ghost: '!rounded-[0px] text-right !p-0 bg-transparent border-none text-gray-600 focus:border-none focus:ring-0 focus:outline-none dark:border-none dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-none dark:focus:ring-0',
        gray: '!rounded h-[38px] border-gray-300 bg-gray-50 text-gray-900 focus:border-wasabi-600 focus:ring-wasabi-600 dark:border-input-stroke bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-wasabi-500 dark:focus:ring-wasabi-500',
        altghost:
          '!rounded h-[38px] bg-transparent border-gray-300 text-gray-900 focus:border-wasabi-600 focus:ring-wasabi-600 dark:border-input-stroke dark:text-white dark:placeholder-gray-400 dark:focus:border-wasabi-500 dark:focus:ring-wasabi-500',
      },
    },
  },
};

const TextInput = React.forwardRef<HTMLInputElement, CustomTextInputProps>(
  ({ type, className, suffix, prefix, inputClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);

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
      if (type === 'password') return '36px';
      if (suffix) return '36px';
      return '';
    };
    const calcPaddingLeft = () => {
      if (prefix) return '28px';
      return '';
    };

    return (
      <div className={twMerge('relative w-full min-w-0', className)}>
        <FlowbiteTextInput
          style={{ paddingRight: calcPaddingRight(), paddingLeft: calcPaddingLeft() }}
          type={inputType}
          theme={theme}
          ref={ref}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-1 flex items-center px-1 text-gray-600 focus:outline-none"
            style={{ maxHeight: '42px' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <IconContext.Provider
              value={{ className: (props?.color === 'failure' ? 'text-gray-900' : props?.color === 'ghost' ? 'text-white' : 'text-gray-500') + ' w-5 h-5 ' }}
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
