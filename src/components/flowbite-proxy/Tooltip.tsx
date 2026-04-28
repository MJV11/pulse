'use client';

import { Tooltip as FlowbiteTooltip, type TooltipProps } from 'flowbite-react';
import clsx from 'clsx';
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  useHover,
  useFocus,
  useInteractions,
  useDismiss,
  useRole,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  safePolygon,
} from '@floating-ui/react';

export interface CustomTooltipProps extends TooltipProps {
  /** Predefined color/typography treatment */
  variant?: 'primary';
  /**
   * Render the tooltip popup in a portal attached to document.body using
   * position:fixed. Use this when the trigger is inside a CSS transform or
   * overflow:hidden ancestor that would clip the standard absolute-positioned popup.
   */
  portal?: boolean;
}

const variantClasses: Record<NonNullable<CustomTooltipProps['variant']>, string> = {
  primary:
    'text-gray-900 bg-white dark:text-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
};

const ARROW_SIDE: Record<string, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function PortalTooltip({
  children,
  content,
  placement = 'top',
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedPlacement = placement ?? 'top';

  const { refs, floatingStyles, context, middlewareData, placement: finalPlacement } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: resolvedPlacement,
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { handleClose: safePolygon() });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  const side = finalPlacement.split('-')[0];
  const arrowSide = ARROW_SIDE[side] ?? 'bottom';

  return (
    <>
      <div ref={refs.setReference} className="w-fit" {...getReferenceProps()}>
        {children}
      </div>
      {mounted &&
        createPortal(
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, zIndex: 9999 }}
            className={clsx(
              'inline-block rounded-lg px-3 py-2 text-sm font-medium shadow-sm',
              'border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800',
              'transition-opacity duration-300',
              open ? 'opacity-100 visible' : 'invisible opacity-0 pointer-events-none',
            )}
          >
            <div className="relative z-20 text-xs font-medium whitespace-normal break-words text-pretty text-center max-w-[22rem] sm:max-w-[26rem] text-gray-900 dark:text-white">
              {content}
            </div>
            <div
              ref={arrowRef}
              className="absolute z-10 h-2 w-2 rotate-45 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700"
              style={{
                [arrowSide]: '-4px',
                left: arrowX != null ? arrowX : undefined,
                top: arrowY != null ? arrowY : undefined,
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function Tooltip({ children, variant = 'primary', className, portal, ...props }: CustomTooltipProps) {
  if (portal) {
    const side = (props.placement ?? 'top').split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
    const portalPlacement = (['top', 'bottom', 'left', 'right'] as const).includes(side) ? side : 'top';
    return (
      <PortalTooltip content={props.content} placement={portalPlacement}>
        {children}
      </PortalTooltip>
    );
  }

  const merged = clsx(variantClasses[variant], className);
  return (
    <FlowbiteTooltip
      {...props}
      className={merged}
      style="light"
      theme={{
        target: 'w-fit',
        animation: 'transition-opacity',
        arrow: {
          base: 'absolute z-10 h-2 w-2 rotate-45',
          style: {
            light:
              'bg-white border-r border-b border-gray-200 dark:bg-gray-800 dark:border-r dark:border-b dark:border-gray-700',
          },
          placement: '-4px',
        },
        // Constrain width and allow wrapping so long strings never expand page width.
        // Center the content for a balanced tooltip over its trigger.
        content:
          'relative z-50 p-0 text-xs font-medium whitespace-normal break-words text-pretty text-center max-w-[22rem] sm:max-w-[26rem]',
      }}
    >
      {children}
    </FlowbiteTooltip>
  );
}

export { Tooltip };
